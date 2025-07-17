# Documentation

In post-quantum world assymetric securety was defeated by marijuana 1 from microsoft so now everyone uses symmetric key encryption aka AES-GCM. There is one problem though: how does a couple of people agree on a secret without sharing it?

Before we begin, here are some words you should know:

- KEM, ML-KEM, ML-KEM-1024, Kyber — algorithm to securely exchange the secret shared key without ever exposing it; it uses a pair of public and secret key for each party and encapsulation process to share the secret
- HKDF — algorithm to convert the shared secret into a AES encryption key
- AES, AES-GCM — algorithm to actually encrypt some data using a key
- DSA, ML-DSA, ML-DSA-87, dilithium — algorithm to sign some message using a private signing key and to verify the signature using the public key

## Client: `ByomClient`

Code in src/client.ts is supposed to be run locally on user's machine.

ByomClient is a class that accepts your messenger's schema and optional padding block size for additional layer of security.

```ts
constructor(options: {
  /**
   * Protobuf schema to encode messages.
   */
  schema: ProtobufSchema
  /**
   * Optional padding block size for the encoded messages in bytes.
   */
  padding?: number
})
```

To use protobuf, install it into your project along with byom:

```
bun add protobufjs && bun add -D protobufjs-cli
```

Then create a .proto file that describes your messages schema. This is essentially how your messages will be encoded and stored. Here is an example to get you started:

```proto
syntax = "proto3";
package foobar;

message Message {
  string from = 1;
  string text = 2;
  int64 timestamp = 3;
}
```

Compile it into JavaScript and optionally create TypeScript definitions file:

```
./node_modules/.bin/pbjs -t static-module -w es6 -o proto.js [path to proto file] && ./node_modules/.bin/pbts -o proto.d.ts proto.js
```

Now that you have proto.js and proto.d.ts files in your project, import the schema into your code:

```ts
import { foobar } from './proto'
```

Note that `foobar` here is the package name you specified earlier in .proto file.

Pass the Message class to the ByomClient class:

```ts
import { ByomClient } from 'byom'
import { foobar } from './proto'

const byomClient = new ByomClient({
	schema: foobar.Message
})
```

Methods that use the schema should be called on ByomClient's **instance** — that is, byomClient variable in the code above. Static determenistic functions that do not depend on schema should be called on ByomClient's **class** — that is, `ByomClient.functionName`.

### `static createInbox(): { id: Uint8Array; lockKey: Uint8Array; lockSignature: Uint8Array; secret: { signKey: Uint8Array; unlockKey: Uint8Array; seed: Uint8Array } }`

This function generates two cryptographically-secure random seeds that are used to generate two keypairs (32 bytes for signing keys keypair and 64 bytes for kem keypairs) and signs KEM public key with a sign private key.

You should announce `id` to recipient, upload `lockKey` to server with `lockSignature` to confirm lockKey belongs to you for your recipients and secretly store signKey and unlockKey to sign requests to storage server and decrypt incoming messages.

**NEVER transfer anything from the `secret` object over network!** Consult ByomClient.secureReceiveSeedInit function for secure ways to connect a new device to the same inbox.

### `static restoreInbox({ seed }: { seed: Uint8Array }): { id: Uint8Array; lockKey: Uint8Array; lockSignature: Uint8Array; secret: { signKey: Uint8Array; unlockKey: Uint8Array; seed: Uint8Array } }`

This function restores the inbox from the seed. Remember: the seed should never leave your computer via any kind of network. Consult ByomClient.secureReceiveSeedInit function for secure ways to connect a new device to the same inbox.

You can view the full example of how to correctly connect a new device to the same inbox in [example/sync-devices/index.ts](./example/sync-devices/index.ts)

### `static verifyRecipient(recipient: { id: Uint8Array; signature: Uint8Array; lockKey: Uint8Array }): boolean`

This function verifies that the server's returned `lockKey` actually belongs to whoever owns the `id` using the `signature`. You should call it before encrypting any messages with `lockKey` to prevent impersonation attack.

### `static signRequest(args: { signKey: Uint8Array; lockKey: Uint8Array; request: Request }): Uint8Array`

This function creates a digital signature that confirms you are the one who owns the `lockKey` and want to request messages for it. You can then pass it in any format you want, like part of formdata body, hex in headers, base64, z85 etc.

Request is an enum you can import and use like this:

```ts
import { Request } from 'byom'

Request.GET_INBOX
```

### `static secureReceiveSeedInit(): { seedTransferPubKey: Uint8Array; seedTransferSecret: Uint8Array }`

In order to securely transmit all keys for your inbox from one device to another,
you need to:

1. Call ByomClient.secureReceiveSeedInit() on the receiving device to generate a pair of keys used to create a secure transfer channel.
2. Call ByomClient.secureSendSeed() on the sending device to encrypt the seed for the secure transfer channel.
3. Call ByomClient.secureReceiveSeedFinalize() on the receiving device to decrypt the seed using the secure transfer channel keys.

This function generates a pair of keys for secure seed transfer channel.

It returns an object containing `seedTransferPubKey` (send it to the sending device) and `seedTransferSecret` (only use it locally with ByomClient.secureReceiveSeedFinalize function).

### `static secureSendSeed(args: { seed: Uint8Array; receiverSeedTransferPubKey: Uint8Array }): Uint8Array`

Encrypts the seed for secure transfer channel.

### `static secureReceiveSeedFinalize(args: { seedTransferSecret: Uint8Array; encryptedSeed: Uint8Array }): Uint8Array`

Decrypts the seed using secure transfer channel's key, generated in first step.

The decrypted seed can be used with the ByomClient.restoreInbox function.

### `encryptMessage(args: { recipient: { lockKey: Uint8Array }, message: InferInterfaceType<ProtobufSchema> }): Uint8Array`

This method encrypts a message to recipient. You should pass recipient's lockKey (previously verified with `verifyRecipient` function) and the message schema params. It outputs an encrypted blob that should be uploaded to the storage server.

### `decryptMessage(args: { unlockKey: Uint8Array; blob: Uint8Array }): ProtobufSchema`

This method decrypts a message using your secret unlockKey and decodes it into the protobuf schema class.

## Server: `ByomServer`

Code in src/server.ts is supposed to be run on storage's machine.

### `static verifyRequestSignature(args: { id: Uint8Array; lockKey: Uint8Array; signature: Uint8Array; request: Request; )}): Uint8Array`

This function verifies request's signature.

- ✅ `id` — accept from user
- ✅ `signature` — accept from user
- ⚠️ `lockKey` — resolve via database using id
- ℹ️ `request` — the API endpoint

Request is an enum you can import and use like this:

```ts
import { Request } from 'byom'

Request.GET_INBOX
```

### `static verifyInboxSignature(args: { id: Uint8Array; lockKey: Uint8Array; lockSignature: Uint8Array }): Uint8Array`

This function verifies that the requester who announces their `id` also owns their `lockKey` using `lockSignature`. All three should be accepted from user. The `lockSignature` must be saved for later. Return it to anyone who requests inbox by `id` along with `lockKey` to prove that the `lockKey` actually belongs to the person who published the `id`.

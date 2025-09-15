# byom examples

This directory contains examples of how you can use [byom](https://git.hloth.dev/hloth/byom).

## Send and receive messages

This example demonstrates how to encrypt and decrypt messages between two people

- [View example](./send-receive-messages/index.ts)

Schema is defined in foobar.proto

To run the example:

1. Clone the repository
2. Install dependencies: `bun install`
3. Compile protobuf: `cd example/send-receive-messages && ./pb.sh`
4. Run index.ts file: `bun index.ts`
5. You should now see something like this: `7/14/2025, 10:31:32 PM A message from “Bob”: «Hi, Alice! This is Bob!»` in your terminal

## Securely syncing devices

This example demonstrates how to securely connect a new device. **Do not ever transfer any secret keys unencrypted.**

- [View example](./sync-devices/index.ts)

To run the example:

1. Clone the repository
2. Install dependencies: `bun install`
3. Run index.ts file: `bun example/sync-devices/index.ts`
4. You should now see that we mock transferring a public key for secure channel and then an encrypted seed. We never transfer the seed or any secret keys unencrypted.

OK to transfer via network:

- `seedTransferPubKey` from ByomClient.secureReceiveSeedInit()
- result of ByomClient.secureSendSeed()

DO NOT TRANSFER via network:

- `secret.seed` from ByomClient.createInbox() or ByomClient.restoreInbox()
- Any other values from `secret` object from ByomClient.createInbox() or ByomClient.restoreInbox()
- `seedTransferSecret` from ByomClient.secureReceiveSeedInit()

/* eslint-disable @typescript-eslint/no-explicit-any */
import { ml_kem1024 } from '@noble/post-quantum/ml-kem'
import { randomBytes, concatBytes } from '@noble/post-quantum/utils'
import { hkdf } from '@noble/hashes/hkdf'
import { sha512 } from '@noble/hashes/sha2'
import { gcm } from '@noble/ciphers/aes'
import { ml_dsa87 } from '@noble/post-quantum/ml-dsa'
import { addVarint, removeVarint, pad, depad } from './padding'
import { HKDF_INFO, HKDF_KEY_LENGTH, NONCE_LENGTH, SALT_LENGTH, type Request } from './consts'

type ProtobufSchema<TInterface = any, TMessage = any> = {
	create(properties?: TInterface): TMessage
	encode(message: TInterface, writer?: any): any
	decode(reader: any): TMessage
}

type InferMessageType<T> = T extends ProtobufSchema<any, infer U> ? U : never
type InferInterfaceType<T> = T extends ProtobufSchema<infer U, any> ? U : never

/**
 * This class is supposed to be used locally on user's machine.
 * It accepts your messenger's schema and optional padding block size for additional layer of security.
 */
class ByomClient<T extends ProtobufSchema> {
	private schema: T
	private padding: number = 0

	constructor(options: {
		/**
		 * Protobuf schema to encode messages.
		 */
		schema: T
		/**
		 * Optional padding block size for the encoded messages in bytes.
		 */
		padding?: number
	}) {
		this.schema = options.schema
		this.padding = options.padding || 0
	}

	/**
	 * Generates two cryptographically-secure random seeds that are used to generate two keypairs (32 bytes for signing keys keypair and 64 bytes for kem keypairs) and signs KEM public key with a sign private key.
	 * You should announce `id` to recipient, upload `lockKey` to server with `lockSignature` to confirm lockKey belongs to you for your recipients and secretly store signKey and unlockKey to sign requests to storage server and decrypt incoming messages.
	 * @returns An object containing `id`, `lockKey`, `lockSignature`, and a `secret` object with `signKey` and `unlockKey`.
	 */
	static createInbox(): {
		id: Uint8Array
		lockKey: Uint8Array
		lockSignature: Uint8Array
		secret: { signKey: Uint8Array; unlockKey: Uint8Array }
	} {
		const sigKeys = ml_dsa87.keygen(randomBytes(32))
		const kemKeys = ml_kem1024.keygen(randomBytes(64))
		return {
			id: sigKeys.publicKey,
			lockKey: kemKeys.publicKey,
			lockSignature: ml_dsa87.sign(sigKeys.secretKey, kemKeys.publicKey),
			secret: {
				signKey: sigKeys.secretKey,
				unlockKey: kemKeys.secretKey
			}
		}
	}

	/**
	 * Verifies that the server's returned `lockKey` actually belongs to whoever owns the `id` using the `signature`.
	 * Call it before encrypting any messages with `lockKey` to prevent impersonation attack.
	 * @param recipient An object containing `id`, `signature`, and `lockKey`.
	 * @param recipient.id The public key of the recipient.
	 * @param recipient.signature The signature of the `lockKey` signed by the recipient's private key.
	 * @param recipient.lockKey The public key of the recipient's KEM keypair.
	 * @returns `true` if the recipient is verified, `false` otherwise.
	 */
	static verifyRecipient(recipient: {
		id: Uint8Array
		signature: Uint8Array
		lockKey: Uint8Array
	}): boolean {
		return ml_dsa87.verify(recipient.id, recipient.lockKey, recipient.signature)
	}

	/**
	 * Creates a digital signature that confirms you are the one who owns the `lockKey` and want to request messages for it.
	 * @param signKey The secret key used to sign the request.
	 * @param lockKey The public key of the KEM keypair that you want to request messages for.
	 * @param request The Request enum value.
	 * @returns A digital signature that can be used to verify the request. You can then pass it in any format you want, like part of formdata body, hex in headers, base64, z85 etc.
	 */
	static signRequest({
		signKey,
		lockKey,
		request
	}: {
		signKey: Uint8Array
		lockKey: Uint8Array
		request: Request
	}): Uint8Array {
		return ml_dsa87.sign(signKey, concatBytes(lockKey, new TextEncoder().encode(request)))
	}

	/**
	 * Encrypts a message to recipient. You should pass recipient's lockKey (previously verified with `verifyRecipient` function) and the message schema params.
	 * @param recipient An object containing the recipient's lockKey.
	 * @param recipient.lockKey The public key of the recipient's KEM keypair.
	 * @param message The message to encrypt, which should match the schema of the client.
	 * @returns An encrypted blob that should be uploaded to the storage server.
	 */
	encryptMessage({
		recipient,
		message
	}: {
		recipient: { lockKey: Uint8Array }
		message: InferInterfaceType<T>
	}): Uint8Array {
		const encapsulated = ml_kem1024.encapsulate(recipient.lockKey)
		const cipherText = pad(addVarint(encapsulated.cipherText), this.padding)
		const salt = randomBytes(SALT_LENGTH)

		const key = hkdf(sha512, encapsulated.sharedSecret, salt, HKDF_INFO, HKDF_KEY_LENGTH)

		const nonce = randomBytes(NONCE_LENGTH)
		const buf = this.schema.encode(message).finish()
		const msg = pad(addVarint(gcm(key, nonce).encrypt(buf)), this.padding)

		const blob = concatBytes(salt, nonce, cipherText, msg)
		return blob
	}

	/**
	 * This method decrypts a message using your secret unlockKey and decodes it into the protobuf schema class.
	 * @param unlockKey The secret key used to decrypt the message.
	 * @param blob The encrypted message blob that was previously uploaded to the storage server.
	 * @returns The decoded message that matches the schema of the client.
	 */
	decryptMessage({ unlockKey, blob }: { unlockKey: Uint8Array; blob: Uint8Array }): Uint8Array {
		const salt = blob.slice(0, SALT_LENGTH)
		const nonce = blob.slice(SALT_LENGTH, SALT_LENGTH + NONCE_LENGTH)
		const { data: cipherText, remaining: msgWithPadding } = removeVarint(
			blob.slice(SALT_LENGTH + NONCE_LENGTH)
		)
		const { data: msg } = removeVarint(depad(msgWithPadding))
		const sharedSecret = ml_kem1024.decapsulate(cipherText, unlockKey)
		const derivedKey = hkdf(sha512, sharedSecret, salt, HKDF_INFO, HKDF_KEY_LENGTH)
		const decrypted = gcm(derivedKey, nonce).decrypt(msg)
		return this.schema.decode(decrypted) as InferMessageType<T>
	}
}

export { ByomClient }

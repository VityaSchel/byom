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

	static createInbox() {
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

	static verifyRecipient(recipient: {
		id: Uint8Array
		signature: Uint8Array
		lockKey: Uint8Array
	}): boolean {
		return ml_dsa87.verify(recipient.id, recipient.lockKey, recipient.signature)
	}

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

	encryptMessage({
		recipient,
		message
	}: {
		recipient: { lockKey: Uint8Array }
		message: InferInterfaceType<T>
	}) {
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

	decryptMessage({ unlockKey, blob }: { unlockKey: Uint8Array; blob: Uint8Array }) {
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

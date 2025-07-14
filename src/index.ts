import { ml_kem1024 } from '@noble/post-quantum/ml-kem'
import { ml_dsa87 } from '@noble/post-quantum/ml-dsa'
import { randomBytes, concatBytes } from '@noble/post-quantum/utils'
import { decode, encode } from './base85'
import { pad } from './padding'
import { hkdf } from '@noble/hashes/hkdf'
import { sha512 } from '@noble/hashes/sha2'
import { gcm } from '@noble/ciphers/aes'

const SALT_LENGTH = 32
const NONCE_LENGTH = 12
const HKDF_INFO = new TextEncoder().encode('byom-msg-cipher-v1')
const HKDF_KEY_LENGTH = 32 // 256 bits

type ProtobufMessage = {
	encode<T extends import('protobufjs').Message<T>>(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		message: T | { [k: string]: any },
		writer?: import('protobufjs').Writer
	): import('protobufjs').Writer
}

class Byom<T extends ProtobufMessage> {
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

	private static getKeys() {
		const seed = randomBytes(64)
		const keys = ml_kem1024.keygen(seed)
		return keys
	}

	static createInbox() {
		const keys = Byom.getKeys()
		return {
			id: encode(keys.publicKey),
			key: keys.secretKey
		}
	}

	static getRecipient(id: string): Uint8Array {
		const recipientKey = decode(id)
		return recipientKey
	}

	encryptMessage({
		recipientId,
		message
	}: {
		recipientId: string
		message: Parameters<T['encode']>[0]
	}) {
		const recipientPk = decode(recipientId)
		const encapsulated = ml_kem1024.encapsulate(recipientPk)
		const cipherText = pad(encapsulated.cipherText, this.padding)
		const salt = randomBytes(SALT_LENGTH)

		const key = hkdf(sha512, encapsulated.sharedSecret, salt, HKDF_INFO, HKDF_KEY_LENGTH)

		const nonce = randomBytes(NONCE_LENGTH)
		const buf = this.schema.encode(message).finish()
		const msg = pad(gcm(key, nonce).encrypt(buf), this.padding)

		const blob = concatBytes(salt, nonce, cipherText, msg)
		return blob
	}

	decryptMessage({ key, blob }: { key: Uint8Array; blob: Uint8Array }) {
		const salt = blob.slice(0, SALT_LENGTH)
		const nonce = blob.slice(SALT_LENGTH, SALT_LENGTH + NONCE_LENGTH)
    const cipherTextAndMsg = blob.slice(SALT_LENGTH + NONCE_LENGTH)
    
	}
}

export { Byom }
export default Byom

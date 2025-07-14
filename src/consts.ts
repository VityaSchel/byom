export const SALT_LENGTH = 32
export const NONCE_LENGTH = 12
export const HKDF_INFO = new TextEncoder().encode('byom-msg-cipher-v1')
export const HKDF_KEY_LENGTH = 32 // 256 bits
export enum Request {
	GET_INBOX = 'get-inbox'
}

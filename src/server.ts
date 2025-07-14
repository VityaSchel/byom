import { concatBytes } from '@noble/post-quantum/utils'
import { ml_dsa87 } from '@noble/post-quantum/ml-dsa'
import type { Request } from './consts'

/**
 * This class is supposed to be used on storage's machine.
 */
class ByomServer {
	/**
	 * This function verifies request's signature.
	 * @param ✅ `id` — accept from user
	 * @param ✅ `signature` — accept from user
	 * @param ⚠️ `lockKey` — resolve via database using id
	 * @param ℹ️ `request` — the API endpoint; Request is an enum
	 * @returns `true` if the signature is valid, `false` otherwise.
	 */
	static verifyRequestSignature({
		id,
		lockKey,
		signature,
		request
	}: {
		id: Uint8Array
		lockKey: Uint8Array
		signature: Uint8Array
		request: Request
	}): boolean {
		return ml_dsa87.verify(id, concatBytes(lockKey, new TextEncoder().encode(request)), signature)
	}

	/**
	 * Verifies that the requester who announces their `id` also owns their `lockKey` using `lockSignature`. All three parameters should be accepted from user. The `lockSignature` must be saved for later. Return it to anyone who requests inbox by `id` along with `lockKey` to prove that the `lockKey` actually belongs to the person who published the `id`.
	 * @param id The public key of the requester.
	 * @param lockKey The public key of the KEM keypair that the requester wants to use.
	 * @param lockSignature The signature of the `lockKey` signed by the requester's private key.
	 * @returns `true` if the signature is valid, `false` otherwise.
	 */
	static verifyInboxSignature({
		id,
		lockKey,
		lockSignature
	}: {
		id: Uint8Array
		lockKey: Uint8Array
		lockSignature: Uint8Array
	}): boolean {
		return ml_dsa87.verify(id, lockKey, lockSignature)
	}
}

export { ByomServer }

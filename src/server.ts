import { concatBytes } from '@noble/post-quantum/utils'
import { ml_dsa87 } from '@noble/post-quantum/ml-dsa'
import type { Request } from './consts'

class ByomServer {
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

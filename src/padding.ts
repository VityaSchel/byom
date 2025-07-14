export function pad(data: Uint8Array, paddingBlockSize = 0): Uint8Array {
	const length = data.length
	const varintBytes = []

	let val = length
	while (val >= 0x80) {
		varintBytes.push((val & 0x7f) | 0x80)
		val >>>= 7
	}
	varintBytes.push(val)

	const totalLength = varintBytes.length + length

	let paddedLength = totalLength
	if (paddingBlockSize > 0) {
		paddedLength = Math.ceil(totalLength / paddingBlockSize) * paddingBlockSize
	}

	const result = new Uint8Array(paddedLength)
	result.set(varintBytes, 0)
	result.set(data, varintBytes.length)

	return result
}

export function unpad(input: Uint8Array): Uint8Array {
	let length = 0
	let shift = 0
	let offset = 0

	while (true) {
		const byte = input[offset]
		if (byte === undefined) throw new Error('Invalid or truncated varint')
		length |= (byte & 0x7f) << shift
		offset++
		if ((byte & 0x80) === 0) break
		shift += 7
		if (shift > 35) throw new Error('Varint too large')
	}

	if (offset + length > input.length) {
		throw new Error('Data length exceeds buffer size')
	}

	return input.slice(offset, offset + length)
}

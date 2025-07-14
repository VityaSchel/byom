const PAD_BYTE = 0

function encodeVarint(num: number): Uint8Array {
	const bytes = []
	while (num > 0x7f) {
		bytes.push((num & 0x7f) | 0x80)
		num >>>= 7
	}
	bytes.push(num)
	return Uint8Array.from(bytes)
}

export function decodeVarint(buf: Uint8Array): { value: number; offset: number } {
	let value = 0
	let shift = 0
	let i = 0
	while (i < buf.length) {
		const b = buf[i]
		if (b === undefined) throw new Error('Buffer too short for varint decoding')
		value |= (b & 0x7f) << shift
		shift += 7
		i++
		if ((b & 0x80) === 0) break
	}
	return { value, offset: i }
}

export function addVarint(data: Uint8Array): Uint8Array {
	const lenVarint = encodeVarint(data.length)
	const combined = new Uint8Array(lenVarint.length + data.length)
	combined.set(lenVarint, 0)
	combined.set(data, lenVarint.length)
	return combined
}

export function encodeWithPad(data: Uint8Array, padLength: number): Uint8Array {
	const varintData = addVarint(data)
	return pad(varintData, padLength)
}

export function removeVarint(buf: Uint8Array): { data: Uint8Array; remaining: Uint8Array } {
	const { value: dataLength, offset } = decodeVarint(buf)
	const data = buf.subarray(offset, offset + dataLength)
	const remaining = buf.subarray(offset + dataLength)
	return { data, remaining }
}

export function pad(data: Uint8Array, padBlockSize: number): Uint8Array {
	const paddedLength = Math.ceil(data.length / padBlockSize) * padBlockSize
	const paddedData = new Uint8Array(paddedLength)
	paddedData.set(data)

	for (let i = data.length; i < paddedLength; i++) {
		paddedData[i] = PAD_BYTE
	}

	return paddedData
}

export function depad(data: Uint8Array): Uint8Array {
	const firstIndex = data.findIndex(v => v !== PAD_BYTE)
	if (firstIndex === -1) {
		return data
	}
	return data.subarray(firstIndex)
}

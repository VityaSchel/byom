export function get6BitChunks(buf: Uint8Array, numChunks = 8): number[] {
	const bits = []
	for (let i = 0; i < buf.length && bits.length < numChunks * 6; i++) {
		for (let j = 7; j >= 0; j--) {
			bits.push((buf[i]! >> j) & 1)
		}
	}

	const chunks: number[] = []
	for (let i = 0; i < numChunks; i++) {
		let chunk = 0
		for (let j = 0; j < 6; j++) {
			chunk = (chunk << 1) | bits[i * 6 + j]!
		}
		chunks.push(chunk)
	}

	return chunks
}

// Carefully curated non-ambiguous, easely-recognizable emojis for 6-bit encoding
export const EMOJI_LIST = [
	'🙂',
	'😡',
	'💩',
	'🤡',
	'🦷',
	'🐵',
	'🌈',
	'☁️',
	'🍎',
	'🎤',
	'✈️',
	'⛱️',
	'💿',
	'💎',
	'⌛️',
	'☎️',
	'💡',
	'🧲',
	'🚽',
	'🔒',
	'🧡',
	'🎁',
	'🍌',
	'🍑',
	'🤢',
	'👍',
	'👻',
	'👀',
	'🕸️',
	'🦋',
	'🦄',
	'🌵',
	'🚬',
	'🧊',
	'🧩',
	'🎈',
	'🍕',
	'🎃',
	'🌽',
	'🥚',
	'🥕',
	'🔑',
	'🧻',
	'🚀',
	'🎯',
	'📦',
	'📸',
	'🧠',
	'🎮',
	'🪜',
	'🚗',
	'🪞',
	'🛴',
	'🧽',
	'🪀',
	'🧨',
	'🧃',
	'🪁',
	'🪥',
	'🖍️',
	'🐠',
	'🐶',
	'🐱',
	'🐭'
]

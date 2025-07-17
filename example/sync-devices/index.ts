import { ByomClient } from '../../src/client'
import { encode } from '../../src/base85'

const _s = (a: Uint8Array): string => a.toHex().slice(0, 64) + '...'

// === Device 1 ===
const device1_inbox = ByomClient.createInbox()
const device1_inboxId = encode(device1_inbox.id)
console.log('[Local] Sending seed:', _s(device1_inbox.secret.seed))

// === Device 2 ===
const device2_transfer_channel = ByomClient.secureReceiveSeedInit()
console.log('[Attacker sees]', _s(device2_transfer_channel.seedTransferPubKey))
console.log('Fingerprint:', device2_transfer_channel.fingerprint)
const transfer_channel_key = device2_transfer_channel.seedTransferPubKey
// Send `device2_transfer_channel.seedTransferPubKey` to Device 1

// An attacker might intercept the `transfer_channel_key` and change it to their own key.
// That is why we present emoji-based fingerprints to user and ask to compare them.

// === Device 1 ===
const transfer_channel_key_fingerprint = ByomClient.fingerprint(transfer_channel_key, 8)
console.log('Fingerprint:', transfer_channel_key_fingerprint)
if (device2_transfer_channel.fingerprint !== transfer_channel_key_fingerprint) {
	throw new Error('Transfer channel key fingerprint does not match! Possible MITM attack!')
}
const encryptedSeed = ByomClient.secureSendSeed({
	seed: device1_inbox.secret.seed,
	receiverSeedTransferPubKey: device2_transfer_channel.seedTransferPubKey
})
// Send `encryptedSeed` to Device 2
console.log('[Attacker sees]', _s(encryptedSeed))

// === Device 2 ===
const seed = ByomClient.secureReceiveSeedFinalize({
	encryptedSeed,
	seedTransferSecret: device2_transfer_channel.seedTransferSecret
})
const device2_inbox = ByomClient.restoreInbox({ seed })
const device2_inboxId = encode(device2_inbox.id)

console.log('[Local] Received seed:', _s(seed))

// =================

if (device1_inboxId === device2_inboxId) {
	console.log(
		'Successfully restored inbox from Device 1 on Device 2 without transferring the seed unencrypted!'
	)
} else {
	throw new Error('Inbox IDs do not match!')
}

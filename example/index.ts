/* eslint-disable @typescript-eslint/no-unused-vars */
import { ByomClient } from '../src/client'
import { Request } from '../src/consts'
import { ByomServer } from '../src/server'
import { foobar } from './proto'

const fetch = (..._: unknown[]) => {} // Mock fetch for example purposes

// Client handles all encryption and encoding stuff
const byomClient = new ByomClient({
	schema: foobar.Message,
	padding: 128
})

// Server only verifies signatures and stores encrypted messages

// 1. Alice creates an inbox. Alice never shares her `secret` keys with anyone.
const aliceInbox = ByomClient.createInbox()

// 2. Alice uploads her lock key (`inbox.lockKey`) and her signature (`inbox.lockSignature`)
//    under her id (`inbox.id`) to the server.
//    Her signature hereby confirms that the lock key belongs to Alice.
fetch('https://example.com/inbox', {
	method: 'POST',
	body: JSON.stringify({
		id: aliceInbox.id,
		lockKey: aliceInbox.lockKey,
		lockSignature: aliceInbox.lockSignature
	})
}) // This is just an example URL, you should implement your own storage server API

// 3. Server verifies Alice's signature before linking her lock key to her id
const isValid = ByomServer.verifyInboxSignature({
	id: aliceInbox.id,
	lockKey: aliceInbox.lockKey,
	lockSignature: aliceInbox.lockSignature
})
if (!isValid) {
	throw new Error('Invalid inbox signature')
}

// 4. Alice shares her inbox id with Bob
const aliceInboxId = aliceInbox.id

// 5. Bob wants to send an encrypted message to Alice, so he asks the server
// 	  for Alice's lock key by her id.
fetch(`https://example.com/inbox/${aliceInboxId}`, {
	method: 'GET'
})
const aliceLockKey = aliceInbox.lockKey
const aliceLockSignature = aliceInbox.lockSignature

// 6. Bob also verifies her signature so that
// 	  someone else could not give him a different lock key pretending to be Alice.
const isValidRecipient = ByomClient.verifyRecipient({
	id: aliceInboxId,
	lockKey: aliceLockKey,
	signature: aliceLockSignature
})
if (!isValidRecipient) {
	throw new Error('Invalid recipient signature')
}

// 7. Bob encrypts his message using Alice's lock key
const blob = byomClient.encryptMessage({
	recipient: {
		lockKey: aliceLockKey
	},
	message: {
		from: 'Bob', // It's a good idea to replace this with Bob's inbox id so that Alice can reply!
		text: 'Hi, Alice! This is Bob!',
		timestamp: Date.now()
	}
})

// 8. Bob uploads the encrypted message to the server
fetch(`https://example.com/${aliceInboxId}`, {
	method: 'POST',
	body: blob
})

// 9. Alice now wants to read her messages, so she fetches them from the server.
//    Server must verify that the request is indeed comes from Alice, so that
//    no one else knows how many messages she has!
const aliceSignature = ByomClient.signRequest({
	signKey: aliceInbox.secret.signKey,
	lockKey: aliceInbox.lockKey,
	request: Request.GET_INBOX
})
fetch(`https://example.com/${aliceInboxId}`, {
	method: 'GET',
	headers: {
		// You can pass authorization anywhere, but it's a good idea to use `Authorization` header
		Authorization: aliceSignature
	}
})

// 10. Server knows that alice's inbox id corresponds to her lock key, it will get
//     the lock key from the database and verify her signature on it before
//     returning the messages.
const isSignatureValid = ByomServer.verifyRequestSignature({
	// The request endpoint
	request: Request.GET_INBOX,
	// From request's payload
	id: aliceInbox.id,
	signature: aliceSignature,
	// From database using payload's `id`
	lockKey: aliceInbox.lockKey
})
if (!isSignatureValid) {
	throw new Error('Invalid request signature')
}

// 11. Alice uses her secret unlock key to decrypt the messages
const decryptedMessage = byomClient.decryptMessage({ key: aliceInbox.secret.unlockKey, blob })

// 12. We have successfully transmitted an encrypted message in post-quantum way!
console.log(
	new Date(Number(decryptedMessage.timestamp)).toLocaleString(),
	`A message from “${decryptedMessage.from}”: «${decryptedMessage.text}»`
)

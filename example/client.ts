import { ByomClient } from '../src/client'
import { foobar } from './proto'

const app = new ByomClient({
	schema: foobar.Message,
	padding: 128
})

const { id, key } = ByomClient.createInbox()
const blob = app.encryptMessage({
	recipient: id,
	message: {
		from: 'Alice',
		text: '1234',
		timestamp: Date.now()
	}
})
console.log(
	app
		.decryptMessage({
			key,
			blob
		})
		.toJSON()
)

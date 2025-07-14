import { Byom } from '../src'
import { foobar } from './proto'

const app = new Byom({ schema: foobar.Message, padding: 128 })

const { id, key } = Byom.createInbox()
console.log(
	app.encryptMessage({
		recipientKey: Byom.getRecipient(id),
		message: {
			from: 'Alice',
			text: '1234',
			timestamp: Date.now()
		}
	})
)

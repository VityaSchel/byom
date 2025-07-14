# byom — Build Your Own Messenger

I'm tired of e2ee messengers complicating stuff and ruining everything so I present to you: a set of ready components for you to build your own post-quantum self-hosted end-to-end encrypted messenger. It contains basic logic that every messenger such as Session, Signal, Matrix, Simplex has under the hood. UI, UX, networking, file I/O, frontend, backend, auth flow, data flow, features, attachments is entirely up to you.

## What is this?

This is a set of pure and determenistic JavaScript modules that you can use to create an end-to-end encrypted messenger.

- If you want to build an instant messenger with cool stuff but don't want to waste your time on cryptography behind it — this is exactly what you're looking for. Especially if you're building it in web. Electron and React Native will work too but eww don't use them.
- If you need a ready secure end-to-end encrypted messenger — this is not what you're looking for. Try one of the projects mentioned.

## Features

- **Simple**: this project keeps it simple by introducing encryption and encoding protocol, you can introduce auth system, users identification, subinboxes, multidevice sync yourself
- **Secure**: uses the best cryptography with no tradeoffs and allows to hide metadata with padding
- **Works everywhere**: built with 100% JavaScript thanks to the [Noble project](https://paulmillr.com/noble/)
- **Stack agnostic**: you can use this with React, Svelte, Vue, Angular, HTMX, vanilla
- **Post quantum**: quantum computers are coming, messages encrypted today could be intercepted and decrypted 20 years later, so this library only uses post-quantum cryptography
- **Your schema**: byom uses protobuf to efficiently encode messages data and transmit them: think of it like a strict binary json; you create schema and handle data

It's also fully typed with TypeScript definitions bundled.

## Cryptography

As stated, this module uses post-quantum cryptography which makes it theoretically more challenging for quantum computers to crack the messages encrypted using byom. Here is the stack:

- Public/private key encryption: ML-KEM (Kyber) — as a post-quantum alternative to X25519 (ECDH) or RSA; ML-KEM-1024 for 256-bit security level. OK after 2030, as per ASD.
- Digital signatures: ML-DSA (Dilithium) — as a post-quantum alternative to Ed25519; ML-DSA-87 for 256-bit security level. OK after 2030, as per ASD.

## Usage

Install package:

```
bun add byom
```

See [example/index.ts]

## Credit

- Thanks to [li0ard](https://github.com/li0ard) for npm signed package publishing workflow ([donate](https://li0ard.rest/donate))
- Thanks to [Paul Miller](https://github.com/paulmillr) for @noble package ([donate](https://github.com/sponsors/paulmillr/))

## License

[MIT](./LICENSE)

## Donate

[hloth.dev/donate](https://hloth.dev/donate)

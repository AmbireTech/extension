import { scrubSentryEventSecrets } from './sentryDataScrubbing'

describe('scrubSentryEventSecrets', () => {
  it('redacts a labeled private key', () => {
    const key = '0x'.concat('a'.repeat(64))
    const event = { extra: { info: `privateKey=${key}` } }

    const result = scrubSentryEventSecrets(event)

    expect(result.extra.info).not.toContain(key)
    expect(result.extra.info).toContain('[REDACTED_PRIVATE_KEY]')
  })

  it('redacts a labeled private key using a colon separator', () => {
    const key = '0x'.concat('a'.repeat(64))
    const event = { extra: { info: `privateKey: ${key}` } }

    const result = scrubSentryEventSecrets(event)

    expect(result.extra.info).not.toContain(key)
  })

  it('redacts an unlabeled raw private key', () => {
    const key = '0x'.concat('b'.repeat(64))
    const event = { message: `failed to sign with ${key}` }

    const result = scrubSentryEventSecrets(event)

    expect(result.message).not.toContain(key)
  })

  it('redacts an unlabeled bare private key with no 0x prefix', () => {
    const key = 'b'.repeat(64)
    const event = { message: `failed to sign with ${key}` }

    const result = scrubSentryEventSecrets(event)

    expect(result.message).not.toContain(key)
  })

  it('redacts multiple secrets appearing in the same string', () => {
    const keyOne = '0x'.concat('1'.repeat(64))
    const keyTwo = '0x'.concat('2'.repeat(64))
    const event = { message: `tried ${keyOne} then fell back to ${keyTwo}` }

    const result = scrubSentryEventSecrets(event)

    expect(result.message).not.toContain(keyOne)
    expect(result.message).not.toContain(keyTwo)
  })

  it('redacts a JSON-style quoted labeled private key', () => {
    const key = '0x'.concat('f'.repeat(64))
    const event = { message: `{"privateKey":"${key}"}` }

    const result = scrubSentryEventSecrets(event)

    expect(result.message).not.toContain(key)
  })

  it('is idempotent: does not further mangle already-redacted text', () => {
    const key = '0x'.concat('a'.repeat(64))
    const oncePassed = scrubSentryEventSecrets({ message: `privateKey=${key}` })
    const twicePassed = scrubSentryEventSecrets({ message: oncePassed.message })

    expect(twicePassed.message).toBe(oncePassed.message)
  })

  it('leaves hex strings shorter or longer than exactly 64 chars untouched', () => {
    const tooShort = '0x'.concat('a'.repeat(63))
    const tooLong = '0x'.concat('a'.repeat(65))
    const event = { message: `${tooShort} ${tooLong}` }

    const result = scrubSentryEventSecrets(event)

    expect(result.message).toBe(event.message)
  })

  it('redacts an arbitrary non-hex, non-wordlist password when it has a sensitive key name', () => {
    const password = 'SuperSecretPassword123!'
    const event = { extra: { password } }

    const result = scrubSentryEventSecrets(event)

    expect(result.extra.password).toBe('[REDACTED]')
  })

  it('redacts values under sensitive key-name variants (pwd, secret, mnemonic) at any depth', () => {
    const event = {
      extra: {
        credentials: {
          pwd: 'arbitrary-value-1',
          secret: 'arbitrary-value-2',
          mnemonic: 'arbitrary-value-3'
        }
      }
    }

    const result = scrubSentryEventSecrets(event)

    expect(result.extra.credentials.pwd).toBe('[REDACTED]')
    expect(result.extra.credentials.secret).toBe('[REDACTED]')
    expect(result.extra.credentials.mnemonic).toBe('[REDACTED]')
  })

  it('matches sensitive key names case-insensitively', () => {
    const event = { extra: { Password: 'arbitrary-value' } }

    const result = scrubSentryEventSecrets(event)

    expect(result.extra.Password).toBe('[REDACTED]')
  })

  // Remaining gap: a password with no identifying key name at all -- e.g. embedded
  // in an already-stringified blob such as `extra.action` in background.ts -- has
  // neither a detectable shape nor a key name to anchor on, so it still passes
  // through. This is why the targeted `getReportableAction` fix in background.ts
  // remains necessary; this scrubber cannot replace it for that specific vector.
  it('GAP: does not redact a password with no key name, embedded in an already-stringified blob', () => {
    const password = 'SuperSecretPassword123!'
    const event = { extra: { action: `{"args":["${password}"]}` } }

    const result = scrubSentryEventSecrets(event)

    expect(result.extra.action).toContain(password)
  })

  // Gap: Error's `message` and `stack` are non-enumerable own properties, so
  // Object.keys() in scrubUnknown never sees them. Sentry's own event
  // serialization usually flattens exception messages into plain, enumerable
  // string fields before beforeSend runs, so this mainly matters if a raw
  // Error instance ends up attached directly to `extra` (e.g. `extra: { err }`).
  it('GAP: does not redact a secret inside a raw Error instance nested in extra data', () => {
    const key = '0x'.concat('9'.repeat(64))
    const event = { extra: { originalError: new Error(`signing failed: ${key}`) } }

    const result = scrubSentryEventSecrets(event)

    expect(result.extra.originalError.message).toContain(key)
  })

  it('redacts a seed phrase labeled inline within the string value (non-sensitive key)', () => {
    const phrase =
      'abandon ability able about above absent absorb abstract absurd abuse access accident'
    const event = { extra: { info: `mnemonic: ${phrase}` } }

    const result = scrubSentryEventSecrets(event)

    expect(result.extra.info).not.toContain(phrase)
    expect(result.extra.info).toContain('[REDACTED_SEED_PHRASE]')
  })

  it('redacts a bare seed phrase with no inline label (non-sensitive key)', () => {
    const phrase =
      'abandon ability able about above absent absorb abstract absurd abuse access accident'
    const event = { extra: { info: phrase } }

    const result = scrubSentryEventSecrets(event)

    expect(result.extra.info).toBe('[REDACTED_SEED_PHRASE]')
  })

  it('redacts the entire value wholesale when the key itself is sensitive (e.g. seedPhrase)', () => {
    const phrase =
      'abandon ability able about above absent absorb abstract absurd abuse access accident'
    const event = { extra: { seedPhrase: phrase } }

    const result = scrubSentryEventSecrets(event)

    expect(result.extra.seedPhrase).toBe('[REDACTED]')
  })

  it('leaves non-string, non-object primitives untouched', () => {
    expect(scrubSentryEventSecrets(42)).toBe(42)
    expect(scrubSentryEventSecrets(true)).toBe(true)
    expect(scrubSentryEventSecrets(null)).toBe(null)
    expect(scrubSentryEventSecrets(undefined)).toBe(undefined)
  })

  it('leaves strings with no secret-shaped content untouched', () => {
    const message = 'network request failed with status 503'

    expect(scrubSentryEventSecrets({ message })).toEqual({ message })
  })

  it('recursively scrubs nested objects and arrays', () => {
    const key = '0x'.concat('c'.repeat(64))
    const event = { a: { b: [{ c: key }] } }

    const result = scrubSentryEventSecrets(event)
    const [firstItem] = result.a.b

    expect(firstItem?.c).not.toContain(key)
  })

  it('does not infinite-loop on circular references', () => {
    const event: any = { a: 1 }
    event.self = event

    expect(() => scrubSentryEventSecrets(event)).not.toThrow()
  })

  it('mutates the original nested objects in place rather than deep-cloning', () => {
    const key = '0x'.concat('d'.repeat(64))
    const nested = { value: key }
    const event = { nested }

    scrubSentryEventSecrets(event)

    // Documents current behavior: callers that hold a reference to a nested
    // object will see it mutated, even though only the top-level call returns.
    expect(nested.value).not.toContain(key)
  })

  // BUG: transaction hashes, block hashes, and other 32-byte hex values are
  // structurally identical to a raw private key (0x + 64 hex chars), so this
  // shape-only rule redacts legitimate, non-secret blockchain data too.
  it('BUG: redacts a transaction hash as if it were a private key (false positive)', () => {
    const txHash = '0x'.concat('e'.repeat(64))
    const event = { extra: { txHash } }

    const result = scrubSentryEventSecrets(event)

    expect(result.extra.txHash).toBe(txHash)
  })

  // BUG: the unlabeled seed-phrase rule matches any run of 12-24 lowercase
  // words, regardless of whether they're real BIP-39 words, so ordinary
  // lowercase error messages get mangled into "[REDACTED_SEED_PHRASE]".
  it('BUG: mangles an ordinary lowercase sentence as if it were a seed phrase (false positive)', () => {
    const message =
      'the transaction was reverted because the account does not have enough balance to cover gas fees'
    const event = { message }

    const result = scrubSentryEventSecrets(event)

    expect(result.message).toBe(message)
  })
})

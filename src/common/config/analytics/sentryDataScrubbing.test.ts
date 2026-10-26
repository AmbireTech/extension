import { scrubSentryEventSecrets } from './sentryDataScrubbing'

describe('scrubSentryEventSecrets', () => {
  it('redacts a labeled private key', () => {
    const key = '0x'.concat('a'.repeat(64))
    const event = { extra: { info: `privateKey=${key}` } }

    const result = scrubSentryEventSecrets(event)

    expect(result.extra.info).not.toContain(key)
    expect(result.extra.info).toContain('[REDACTED_HEX]')
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

  it('redacts a JSON-quoted labeled private key embedded in a larger non-JSON string, via the labeled rule specifically', () => {
    const key = '0x'.concat('f'.repeat(64))
    // Not parseable as a whole (doesn't start with `{`/`[`), so this exercises
    // scrubString's REDACTION_RULES rather than the JSON-recursion path -- a
    // bare `{"privateKey":"..."}` string would be fully JSON-parsed instead and
    // redacted wholesale by the sensitive-key check, never reaching this rule.
    const event = { message: `Error: failed to process {"privateKey":"${key}"} during signing` }

    const result = scrubSentryEventSecrets(event)

    expect(result.message).not.toContain(key)
    // Asserts the labeled rule actually matched (not just the unlabeled bare-hex
    // rule catching the value independently and masking a broken label match).
    expect(result.message).toContain('privateKey=[REDACTED_HEX]')
  })

  it('redacts a JSON-quoted labeled seed phrase embedded in a larger non-JSON string, via the labeled rule specifically', () => {
    const phrase =
      'abandon ability able about above absent absorb abstract absurd abuse access accident'
    const event = { message: `Error: failed to restore {"mnemonic":"${phrase}"} during import` }

    const result = scrubSentryEventSecrets(event)

    expect(result.message).not.toContain(phrase)
    expect(result.message).toContain('mnemonic=[REDACTED_SEED_PHRASE]')
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

  it('recovers structure from an already-stringified JSON blob so named keys still get redacted', () => {
    const password = 'SuperSecretPassword123!'
    const event = { extra: { info: `{"password":"${password}","user":"alice"}` } }

    const result = scrubSentryEventSecrets(event)

    expect(result.extra.info).not.toContain(password)
    expect(result.extra.info).toContain('alice')
  })

  it('redacts a secret inside a raw Error instance nested in extra data', () => {
    const key = '0x'.concat('9'.repeat(64))
    const event = { extra: { originalError: new Error(`signing failed: ${key}`) } }

    const result = scrubSentryEventSecrets(event)

    expect(result.extra.originalError.message).not.toContain(key)
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

  it('does not mutate the original event or its nested objects', () => {
    const key = '0x'.concat('d'.repeat(64))
    const nested = { value: key }
    const event = { nested }

    const result = scrubSentryEventSecrets(event)

    // The input must stay untouched -- `extra`/`contexts` data can in principle
    // reference live application objects shared elsewhere, and mutating those
    // in place would silently corrupt real app state, not just the Sentry payload.
    expect(nested.value).toBe(key)
    expect(event.nested).toBe(nested)
    expect(result).not.toBe(event)
    expect(result.nested).not.toBe(nested)
    expect(result.nested.value).not.toContain(key)
  })

  it('does not redact a transaction hash under a key that identifies it as public data', () => {
    const txHash = '0x'.concat('e'.repeat(64))
    const event = { extra: { txHash } }

    const result = scrubSentryEventSecrets(event)

    expect(result.extra.txHash).toBe(txHash)
  })

  it('does not redact a 32-byte value under other known-public key names', () => {
    const value = '0x'.concat('7'.repeat(64))
    const event = {
      extra: {
        safeTxHash: value,
        userOpHash: value,
        txnId: value,
        fromRequestId: value,
        activeRouteId: value,
        quoteId: value,
        signature: value,
        salt: value,
        nonce: value,
        calldata: value
      }
    }

    const result = scrubSentryEventSecrets(event)

    expect(result.extra).toEqual(event.extra)
  })

  it('redacts a valid 24-word window within a longer run, leaving the rest of the run intact', () => {
    const words = Array.from({ length: 30 }, () => 'abandon').join(' ')
    const event = { message: words }

    const result = scrubSentryEventSecrets(event)

    expect(result.message).toBe(
      '[REDACTED_SEED_PHRASE] abandon abandon abandon abandon abandon abandon'
    )
  })

  it('scrubs a long non-matching string (e.g. a stack trace) without a meaningful performance cliff', () => {
    const longLine = `at someFunction (${'x'.repeat(2000)}.js:1:1)\n`
    const stack = longLine.repeat(50)

    const start = performance.now()
    scrubSentryEventSecrets({ message: stack })
    const elapsedMs = performance.now() - start

    // A regression back to a catastrophic-backtracking shape would blow well
    // past this on a string of this size; a healthy run finishes in single-digit ms.
    expect(elapsedMs).toBeLessThan(1000)
  })

  it('still redacts an unlabeled raw hex key when there is no key name to trust', () => {
    const key = '0x'.concat('e'.repeat(64))
    const event = { message: `unexpected value ${key}` }

    const result = scrubSentryEventSecrets(event)

    expect(result.message).not.toContain(key)
  })

  it('redacts a real seed phrase even when the key name gives no hint', () => {
    const phrase =
      'abandon ability able about above absent absorb abstract absurd abuse access accident'
    const event = { message: phrase }

    const result = scrubSentryEventSecrets(event)

    expect(result.message).toBe('[REDACTED_SEED_PHRASE]')
  })

  it('does not mangle an ordinary lowercase sentence that is not real BIP-39 words', () => {
    const message =
      'the transaction was reverted because the account does not have enough balance to cover gas fees'
    const event = { message }

    const result = scrubSentryEventSecrets(event)

    expect(result.message).toBe(message)
  })

  it('redacts a real seed phrase embedded within longer surrounding prose', () => {
    const phrase =
      'abandon ability able about above absent absorb abstract absurd abuse access accident'
    const event = { message: `my recovery phrase is ${phrase} and i wrote it on paper` }

    const result = scrubSentryEventSecrets(event)

    expect(result.message).toBe(
      'my recovery phrase is [REDACTED_SEED_PHRASE] and i wrote it on paper'
    )
  })

  it('redacts a real seed phrase even when its words are capitalized', () => {
    const phrase =
      'Abandon Ability Able About Above Absent Absorb Abstract Absurd Abuse Access Accident'
    const event = { message: `mnemonic: ${phrase}` }

    const result = scrubSentryEventSecrets(event)

    expect(result.message).not.toContain('Abandon')
    expect(result.message).toContain('[REDACTED_SEED_PHRASE]')
  })

  it('redacts a capitalized bare seed phrase with no label', () => {
    const phrase =
      'ABANDON ABILITY ABLE ABOUT ABOVE ABSENT ABSORB ABSTRACT ABSURD ABUSE ACCESS ACCIDENT'
    const event = { message: phrase }

    const result = scrubSentryEventSecrets(event)

    expect(result.message).toBe('[REDACTED_SEED_PHRASE]')
  })

  it('redacts a real secret under a key merely containing "data" (requestData, keyData)', () => {
    const secret = '0x'.concat('a'.repeat(64))
    const event = { extra: { requestData: secret, keyData: secret } }

    const result = scrubSentryEventSecrets(event)

    expect(result.extra.requestData).not.toBe(secret)
    expect(result.extra.keyData).not.toBe(secret)
  })

  it('still trusts the narrower "calldata" key name for public, non-secret data', () => {
    const value = '0x'.concat('a'.repeat(64))
    const event = { extra: { calldata: value } }

    const result = scrubSentryEventSecrets(event)

    expect(result.extra.calldata).toBe(value)
  })

  it('does not throw when a non-cloneable value (e.g. a function) appears anywhere in the event', () => {
    const event = { extra: { callback: () => {}, safe: 'hello' } }

    expect(() => scrubSentryEventSecrets(event)).not.toThrow()
  })

  it('drops a function value from an object instead of throwing or keeping it', () => {
    const event = { extra: { callback: () => {}, safe: 'hello' } } as any

    const result = scrubSentryEventSecrets(event)

    expect('callback' in result.extra).toBe(false)
    expect(result.extra.safe).toBe('hello')
  })

  it('drops a function value from an array (as null) instead of throwing', () => {
    const event = { list: [1, () => {}, 'safe'] } as any

    const result = scrubSentryEventSecrets(event)

    expect(result.list).toEqual([1, null, 'safe'])
  })

  it('preserves Date values instead of collapsing them to an empty object', () => {
    const date = new Date('2024-01-01T00:00:00.000Z')
    const event = { extra: { createdAt: date } }

    const result = scrubSentryEventSecrets(event)

    expect(result.extra.createdAt).toBeInstanceOf(Date)
    expect(result.extra.createdAt.getTime()).toBe(date.getTime())
    expect(result.extra.createdAt).not.toBe(date)
  })

  it('still redacts a key literally named "mnemonic" (not just "seed")', () => {
    const event = { extra: { mnemonic: 'some arbitrary value' } }

    const result = scrubSentryEventSecrets(event)

    expect(result.extra.mnemonic).toBe('[REDACTED]')
  })

  it('redacts extraEntropy regardless of the shape of its value', () => {
    const event = { extra: { action: JSON.stringify({ args: [{ extraEntropy: '0xdeadbeef' }] }) } }

    const result = scrubSentryEventSecrets(event)

    expect(result.extra.action).not.toContain('0xdeadbeef')
    expect(result.extra.action).toContain('[REDACTED]')
  })

  describe('wallet addresses', () => {
    const ADDRESS = '0x'.concat('ab12'.repeat(10))
    const CHECKSUMMED = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B'

    it('redacts an address in messages, exception values, breadcrumbs and tags', () => {
      const event = {
        message: `failed for ${ADDRESS}`,
        exception: { values: [{ type: 'Error', value: `bad account ${CHECKSUMMED}` }] },
        breadcrumbs: [
          { message: `balance of ${ADDRESS}`, data: { url: `https://x.io/a/${ADDRESS}?q=1` } }
        ],
        tags: { account: ADDRESS },
        extra: { list: [ADDRESS] },
        contexts: { acc: { id: CHECKSUMMED } }
      }

      const serialized = JSON.stringify(scrubSentryEventSecrets(event))

      expect(serialized).not.toContain(ADDRESS)
      expect(serialized).not.toContain(CHECKSUMMED)
      expect(serialized).toContain('https://x.io/a/[REDACTED_ADDRESS]?q=1')
    })

    it('redacts the address under address-named keys instead of trusting the key', () => {
      const event = { extra: { address: ADDRESS, accountAddr: CHECKSUMMED, fromAddress: ADDRESS } }

      const result = scrubSentryEventSecrets(event)

      expect(result.extra).toEqual({
        address: '[REDACTED_ADDRESS]',
        accountAddr: '[REDACTED_ADDRESS]',
        fromAddress: '[REDACTED_ADDRESS]'
      })
    })

    it('redacts addresses inside a stringified JSON blob and keeps the rest', () => {
      const event = { extra: { action: `{"params":{"addr":"${ADDRESS}","chainId":1}}` } }

      const result = scrubSentryEventSecrets(event)

      expect(JSON.parse(result.extra.action)).toEqual({
        params: { addr: '[REDACTED_ADDRESS]', chainId: 1 }
      })
    })

    it('redacts several addresses glued to punctuation in one string', () => {
      const event = { message: `(${ADDRESS}),${CHECKSUMMED}/` }

      expect(scrubSentryEventSecrets(event).message).toBe(
        '([REDACTED_ADDRESS]),[REDACTED_ADDRESS]/'
      )
    })

    it('never partially redacts a 64-hex value: it becomes one [REDACTED_HEX]', () => {
      const hex = '0x'.concat('ab12'.repeat(16))

      expect(scrubSentryEventSecrets({ message: hex }).message).toBe('[REDACTED_HEX]')
    })

    it('still redacts an address left-padded to 32 bytes as hex, not as an address', () => {
      const padded = '0x'.concat('0'.repeat(24), 'ab12'.repeat(10))

      expect(scrubSentryEventSecrets({ message: padded }).message).toBe('[REDACTED_HEX]')
    })

    it('does not cut an address-sized prefix out of longer hex such as calldata', () => {
      const longHex = '0x'.concat('ab12'.repeat(20))
      const event = { message: longHex }

      expect(scrubSentryEventSecrets(event).message).toBe(longHex)
    })

    it('keeps a hash under a hash-like key but still redacts an address under that key', () => {
      const hash = '0x'.concat('e'.repeat(64))
      const event = { extra: { txHash: hash, signatureSigner: ADDRESS, callData: ADDRESS } }

      const result = scrubSentryEventSecrets(event)

      expect(result.extra.txHash).toBe(hash)
      expect(result.extra.signatureSigner).toBe('[REDACTED_ADDRESS]')
      expect(result.extra.callData).toBe('[REDACTED_ADDRESS]')
    })

    it('redacts an address embedded in a message under a hash-like key', () => {
      const event = { extra: { txHash: `pending from ${ADDRESS}` } }

      expect(scrubSentryEventSecrets(event).extra.txHash).toBe('pending from [REDACTED_ADDRESS]')
    })

    it('is idempotent for addresses', () => {
      const once = scrubSentryEventSecrets({ message: `to ${ADDRESS}` })

      expect(scrubSentryEventSecrets(once)).toEqual(once)
    })

    it('leaves 39-hex and non-hex lookalikes untouched', () => {
      const short = '0x'.concat('a'.repeat(39))
      const nonHex = '0x'.concat('g'.repeat(40))
      const event = { message: `${short} ${nonHex}` }

      expect(scrubSentryEventSecrets(event).message).toBe(event.message)
    })
  })
})

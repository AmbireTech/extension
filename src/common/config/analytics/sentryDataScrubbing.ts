import { wordlists } from 'ethers'

type RedactionRule = {
  pattern: RegExp
  replacement: string | ((...match: string[]) => string)
}

const englishWordlist = wordlists.en

const SEED_PHRASE_MIN_WORDS = 12
const SEED_PHRASE_MAX_WORDS = 24

// Case-insensitive: BIP-39 wordlists are stored lowercase, but a real phrase can
// appear capitalized (e.g. auto-capitalized by a mobile text field), so every
// word is lowercased before the wordlist lookup.
const areAllValidBip39Words = (words: string[]): boolean => {
  if (!englishWordlist) return false
  return words.every((word) => englishWordlist.getWordIndex(word.toLowerCase()) !== -1)
}

// Finds a contiguous 12-24 word BIP-39-valid subsequence anywhere within a run
// of words and redacts just that span, leaving surrounding words untouched --
// this lets a real seed phrase embedded in longer prose (e.g. "my recovery
// phrase is <12 words> and i wrote it on paper") still be found, without
// encoding the length bound into the regex itself (see wordRunPattern below).
// The word-count bound is checked here in plain JS/array logic rather than via
// a regex {n,m} quantifier on a repeated group, to avoid that construct's
// backtracking overhead (a mild ReDoS shape) on long non-matching input such
// as stack traces.
const redactSeedPhraseWithinWordRun = (wordRun: string): string => {
  const words = wordRun.split(/\s+/)
  if (words.length < SEED_PHRASE_MIN_WORDS) return wordRun

  for (let start = 0; start <= words.length - SEED_PHRASE_MIN_WORDS; start += 1) {
    const maxLen = Math.min(SEED_PHRASE_MAX_WORDS, words.length - start)
    for (let len = maxLen; len >= SEED_PHRASE_MIN_WORDS; len -= 1) {
      const candidate = words.slice(start, start + len)
      if (areAllValidBip39Words(candidate)) {
        const before = words.slice(0, start)
        const after = words.slice(start + len)
        return [...before, '[REDACTED_SEED_PHRASE]', ...after].join(' ')
      }
    }
  }

  return wordRun
}

// A single maximal run of letters-and-whitespace (case-insensitive so a
// capitalized phrase is still captured as one run); the actual seed-phrase
// detection/redaction happens in redactSeedPhraseWithinWordRun above.
const wordRunPattern = /[a-z]+(?:\s+[a-z]+)*/gi

// Regex-based redaction for high-risk secrets. This can still produce false positives/negatives.
const REDACTION_RULES: RedactionRule[] = [
  {
    // Matches known private-key labels and the following value. The optional
    // (?:["'])? after the label handles JSON-quoted keys, e.g. "privateKey":"0x...".
    pattern:
      /\b(private\s*key|privatekey|priv\s*key|privkey|secret\s*key|wallet\s*key)\b(?:["'])?\s*[:=]\s*(["']?)(0x[a-fA-F0-9]{64}|[a-fA-F0-9]{64})\2/gi,
    replacement: '$1=[REDACTED_PRIVATE_KEY]'
  },
  {
    // Matches likely raw private keys without a label.
    pattern: /\b0x[a-fA-F0-9]{64}\b|\b[a-fA-F0-9]{64}\b/g,
    replacement: '[REDACTED_PRIVATE_KEY]'
  },
  {
    // Matches common seed phrase labels and the following run of words.
    // The optional (?:["'])? after the label handles JSON-quoted keys, e.g.
    // "mnemonic":"word word ...".
    pattern:
      /\b(seed\s*phrase|recovery\s*phrase|mnemonic|secret\s*phrase)\b(?:["'])?\s*[:=]\s*(["']?)([a-z]+(?:\s+[a-z]+)*)\2/gi,
    replacement: (match: string, label: string, _quote: string, words: string) => {
      const redacted = redactSeedPhraseWithinWordRun(words)
      return redacted === words ? match : `${label}=${redacted}`
    }
  },
  {
    // Matches any maximal run of words; the actual 12-24-word/BIP-39 check and
    // redaction happens in redactSeedPhraseWithinWordRun.
    pattern: wordRunPattern,
    replacement: (match: string) => redactSeedPhraseWithinWordRun(match)
  }
]

const scrubString = (value: string): string => {
  return REDACTION_RULES.reduce((result, { pattern, replacement }) => {
    return result.replace(pattern, replacement as (...match: string[]) => string)
  }, value)
}

// A password/secret has no detectable shape (unlike a private key or seed phrase),
// so it can't be caught by REDACTION_RULES. Its key name is the only reliable signal,
// so any value under a matching key is redacted wholesale regardless of its content.
const SENSITIVE_KEY_SUBSTRINGS = [
  'pass',
  'pwd',
  'secret',
  'mnemonic',
  'seed',
  'privatekey',
  'privkey'
]

const isSensitiveKey = (key: string): boolean => {
  const normalizedKey = key.toLowerCase()
  return SENSITIVE_KEY_SUBSTRINGS.some((term) => normalizedKey.includes(term))
}

// Transaction hashes, block hashes, and other 32-byte digests are structurally
// identical to a raw private key, so the shape-based rule above would otherwise
// redact them too. A key name that clearly identifies public, non-secret
// blockchain/request data is trusted over the shape-based rule. Checked separately
// from (and after) SENSITIVE_KEY_SUBSTRINGS, so e.g. `privateKeyAddress` still
// redacts. Deliberately NOT a bare 'data' -- that matched (and skipped shape-based
// redaction for) unrelated keys like `requestData`/`keyData`/`userData`, which can
// legitimately hold secrets; 'calldata' is specific enough to avoid that.
// Only helps when the value is reachable under one of these key names -- the same
// value sitting unlabeled in a message string, or in a positional args array,
// still gets redacted (see the GAP test for the latter).
const NON_SECRET_KEY_SUBSTRINGS = [
  'hash', // covers txHash, transactionHash, safeTxHash, safeTxnHash, messageHash, callbackHash, sighash, userOpHash, blockHash
  'txid',
  'txnid',
  'requestid', // covers requestId, fromRequestId
  'routeid', // covers routeId, activeRouteId
  'quoteid',
  'signature',
  'salt',
  'nonce',
  'calldata',
  'blocknumber',
  'address',
  'addr'
]

const isNonSecretKey = (key: string): boolean => {
  const normalizedKey = key.toLowerCase()
  return NON_SECRET_KEY_SUBSTRINGS.some((term) => normalizedKey.includes(term))
}

// Realm-independent Error check: unlike `instanceof Error`, this still works
// even if an Error-like value's prototype chain ends up pointing at a
// different `Error` global (e.g. across a VM/test sandbox boundary).
const isErrorLike = (value: object): value is Error =>
  Object.prototype.toString.call(value) === '[object Error]'

// Attempts to recover structure that was lost to JSON.stringify (e.g. Sentry's
// `extra.action` in background.ts) so key-based redaction can still reach named
// fields inside it. Values with no key name at all (e.g. a positional args
// array) remain unfixable this way -- there's nothing to key-match against.
const tryScrubJsonString = (value: string, seen: Map<object, unknown>): string | undefined => {
  const trimmed = value.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return undefined

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return undefined
  }

  if (!parsed || typeof parsed !== 'object') return undefined

  return JSON.stringify(scrubUnknown(parsed, seen))
}

// Builds a scrubbed COPY of `value` in the same pass that clones it, instead of
// cloning first (e.g. via structuredClone) and mutating the clone. This avoids
// structuredClone's DataCloneError on values it can't clone (functions, some
// host objects) -- those are simply dropped here instead of throwing, matching
// how JSON.stringify already treats them elsewhere in this codebase. Cycles are
// handled via `seen`, a Map from an original object to its (possibly
// still-being-built) clone, so a self-reference in the input becomes the same
// self-reference in the output rather than being merely skipped.
const scrubUnknown = (value: unknown, seen: Map<object, unknown>): unknown => {
  if (typeof value === 'string') {
    return tryScrubJsonString(value, seen) ?? scrubString(value)
  }

  if (typeof value === 'function' || typeof value === 'symbol') {
    return undefined
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  if (seen.has(value)) {
    return seen.get(value)
  }

  if (value instanceof Date) {
    return new Date(value.getTime())
  }

  if (isErrorLike(value)) {
    const rawMessage = (value as Error).message
    const clonedError = new Error(typeof rawMessage === 'string' ? scrubString(rawMessage) : '')
    seen.set(value, clonedError)

    Object.getOwnPropertyNames(value).forEach((propName) => {
      if (propName === 'message') return
      ;(clonedError as unknown as Record<string, unknown>)[propName] = scrubUnknown(
        (value as unknown as Record<string, unknown>)[propName],
        seen
      )
    })

    return clonedError
  }

  if (Array.isArray(value)) {
    const clonedArray: unknown[] = []
    seen.set(value, clonedArray)
    value.forEach((item) => {
      const scrubbed = scrubUnknown(item, seen)
      clonedArray.push(scrubbed === undefined ? null : scrubbed)
    })
    return clonedArray
  }

  const objectValue = value as Record<string, unknown>
  const clonedObject: Record<string, unknown> = {}
  seen.set(value, clonedObject)

  Object.keys(objectValue).forEach((key) => {
    if (isSensitiveKey(key)) {
      clonedObject[key] = '[REDACTED]'
      return
    }

    if (isNonSecretKey(key) && typeof objectValue[key] === 'string') {
      // Trust the key name; skip shape-based redaction for known-public data.
      clonedObject[key] = objectValue[key]
      return
    }

    const scrubbed = scrubUnknown(objectValue[key], seen)
    if (scrubbed !== undefined) {
      clonedObject[key] = scrubbed
    }
  })

  return clonedObject
}

export const scrubSentryEventSecrets = <T>(event: T): T => {
  return scrubUnknown(event, new Map()) as T
}

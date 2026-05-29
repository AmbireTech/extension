interface RequestData {
  url: string
  postData: string | null
}

/**
 * Builds all realistic encodings of a secret that could appear in a network request.
 *
 * For a private key (64 hex chars without 0x prefix):
 *   - raw hex lowercase (with and without 0x prefix)
 *   - base64 of the 32 raw bytes — how private keys are often stored/transported in binary protocols
 *   - base64url variant of the above (URL-safe alphabet, no padding)
 *   - base64 of the hex string itself (as text, not bytes)
 *   - base64url variant of the above
 *   - percent-encoded (URL encoding of the hex string)
 *
 * For a seed phrase these encodings are also computed on the full phrase string,
 * but seed leak detection primarily relies on containsConsecutiveSeedWords() instead.
 *
 * Encodings shorter than 8 chars are dropped to prevent false positives.
 */
function computeEncodings(secret: string): string[] {
  const trimmed = secret.trim()
  const lower = trimmed.toLowerCase()
  const noPrefix = lower.startsWith('0x') ? lower.slice(2) : lower

  const encodings: string[] = [lower, noPrefix]

  // base64 of the raw bytes — only meaningful for 32-byte (64 hex char) private keys
  if (/^[0-9a-f]{64}$/.test(noPrefix)) {
    encodings.push(Buffer.from(noPrefix, 'hex').toString('base64'))
    encodings.push(Buffer.from(noPrefix, 'hex').toString('base64url'))
  }

  // base64 of the secret treated as a plain string (not bytes)
  encodings.push(Buffer.from(lower).toString('base64'))
  encodings.push(Buffer.from(lower).toString('base64url'))

  // percent-encoding (e.g. if appended to a URL query parameter)
  encodings.push(encodeURIComponent(lower))

  return [...new Set(encodings)].filter((e) => e.length > 8)
}

/**
 * Detects partial seed phrase leaks by sliding a window of `windowSize` consecutive
 * words over the phrase and checking if any window appears in the haystack.
 *
 * Catching 3 consecutive words is enough to confirm a leak while avoiding false
 * positives from common English words that might appear individually in request data.
 *
 * Falls back to a full-phrase match for phrases shorter than windowSize words.
 */
function containsConsecutiveSeedWords(haystack: string, phrase: string, windowSize = 3): boolean {
  const words = phrase.trim().toLowerCase().split(/\s+/)
  if (words.length < windowSize) return haystack.includes(phrase.toLowerCase())

  for (let i = 0; i <= words.length - windowSize; i++) {
    const chunk = words.slice(i, i + windowSize).join(' ')
    if (haystack.includes(chunk)) return true
  }
  return false
}

/**
 * Returns true if a single request contains any encoding of the secret.
 *
 * Both the URL and the POST body are searched (haystack = url + body).
 * For seed phrases the consecutive-words check runs first; all secrets also
 * go through the full encodings list so that base64 or percent-encoded leaks
 * are caught regardless of whether the secret is a key or a phrase.
 */
function requestContainsSecret(req: RequestData, encodings: string[], rawSecret: string): boolean {
  const haystack = `${req.url} ${req.postData ?? ''}`.toLowerCase()
  const isSeedPhrase = rawSecret.trim().includes(' ')

  if (isSeedPhrase && containsConsecutiveSeedWords(haystack, rawSecret)) return true

  return encodings.some((enc) => haystack.includes(enc.toLowerCase()))
}

/**
 * Main entry point.
 *
 * Flow:
 *   1. computeEncodings() — derive every realistic representation of the secret
 *      (raw hex, base64 of bytes, base64 of string, percent-encoded, etc.)
 *   2. For each collected request, build a haystack from its URL + POST body
 *   3. For seed phrases, also run the sliding-window word check (catches partial leaks)
 *   4. Return the URLs of any requests where a match was found
 */
export function findSecretInRequests(requests: RequestData[], secret: string): string[] {
  const encodings = computeEncodings(secret)

  return requests
    .filter((req) => requestContainsSecret(req, encodings, secret))
    .map((req) => req.url)
}

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
 * Normalizes request text so the consecutive-words search is agnostic to how the
 * phrase words were separated. Mnemonics may leak in many serializations - a JSON
 * array (["abandon","ability"]), comma-separated, form-encoded (abandon+ability),
 * newline-separated, or percent-encoded (abandon%20ability / abandon%2Cability).
 *
 * Steps:
 *   1. URL-decode so percent-encoded separators (%20, %2C, ...) become real chars
 *      (falls back to the raw text if the input is not valid percent-encoding)
 *   2. Replace every run of non-alphanumeric characters with a single space, so all
 *      of the separators above collapse to the same single-space form used by the
 *      space-joined window chunks below
 *
 * This normalization is intentionally NOT applied to the encodings search, whose
 * base64/percent-encoded forms rely on those very characters (+, /, =, %).
 */
function normalizeForWordSearch(text: string): string {
  let decoded = text
  try {
    decoded = decodeURIComponent(text)
  } catch {
    // Malformed percent-encoding — keep the raw text rather than throwing.
  }

  return decoded
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Detects partial seed phrase leaks by sliding a window of `windowSize` consecutive
 * words over the phrase and checking if any window appears in the haystack.
 *
 * Catching 3 consecutive words is enough to confirm a leak while avoiding false
 * positives from common English words that might appear individually in request data.
 *
 * The haystack is normalized first (see normalizeForWordSearch) so the match holds
 * regardless of how the phrase words were separated in the request.
 *
 * Falls back to a full-phrase match for phrases shorter than windowSize words.
 */
function containsConsecutiveSeedWords(haystack: string, phrase: string, windowSize = 3): boolean {
  const normalizedHaystack = normalizeForWordSearch(haystack)
  const words = phrase.trim().toLowerCase().split(/\s+/)
  if (words.length < windowSize) return normalizedHaystack.includes(normalizeForWordSearch(phrase))

  for (let i = 0; i <= words.length - windowSize; i++) {
    const chunk = words.slice(i, i + windowSize).join(' ')
    if (normalizedHaystack.includes(chunk)) return true
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

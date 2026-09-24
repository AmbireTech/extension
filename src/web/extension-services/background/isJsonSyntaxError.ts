// Every engine mentions JSON when parsing fails, e.g. "is not valid JSON" in Chrome and
// "JSON.parse: unexpected character" in Firefox
const JSON_MESSAGE_SUBSTRING = 'json'

/**
 * Whether the error comes from parsing a body that isn't JSON, such as the HTML error page a
 * service returns during an outage. Other syntax errors, like a BigInt built from a bad string,
 * give false.
 */
export const isJsonSyntaxError = (error: unknown): boolean =>
  error instanceof Error &&
  error.name === 'SyntaxError' &&
  error.message.toLowerCase().includes(JSON_MESSAGE_SUBSTRING)

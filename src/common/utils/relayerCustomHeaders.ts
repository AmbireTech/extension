import { RELAYER_URL } from '@env'

/**
 * Read from the process env, not from `@env`, so that this value and the build check in
 * `scripts/validateEnv.js` always see the same thing. The build refuses any value in CI,
 * so a build that reaches users never carries it.
 */
const RELAYER_CUSTOM_HEADERS: Record<string, string> = process.env.RELAYER_CUSTOM_HEADERS
  ? JSON.parse(process.env.RELAYER_CUSTOM_HEADERS)
  : {}

const hasRelayerCustomHeaders = Object.keys(RELAYER_CUSTOM_HEADERS).length > 0
const relayerOrigin = hasRelayerCustomHeaders ? new URL(RELAYER_URL).origin : ''

/**
 * Same as `fetch`, but adds the relayer custom headers to the requests that go to the
 * relayer. Any other url, like a look-alike host, gets nothing extra. The headers are
 * applied last, so a caller can not overwrite them.
 */
const fetchWithRelayerCustomHeaders: typeof fetch = (input, init) => {
  if (!hasRelayerCustomHeaders) return fetch(input, init)

  const url = typeof input === 'string' ? input : 'url' in input ? input.url : input.href
  const isRelayerUrl = url === relayerOrigin || url.startsWith(`${relayerOrigin}/`)
  if (!isRelayerUrl) return fetch(input, init)

  const headers = new Headers(
    init?.headers ?? (typeof input === 'object' && 'headers' in input ? input.headers : undefined)
  )
  Object.entries(RELAYER_CUSTOM_HEADERS).forEach(([name, value]) => headers.set(name, value))

  return fetch(input, { ...init, headers })
}

export { fetchWithRelayerCustomHeaders }

/**
 * The id that identifies an app instance (extension or mobile) in the internal
 * Ambire analytics. Sent as the `x-app-source` header on requests to Ambire APIs
 * and used as the Sentry user id. Deliberately derived from the keystore uid, so
 * that it is stable per installation, but not traceable back to the user.
 */
const getAppInstanceId = (keystoreUid: string | null, inviteCode: string | null): string => {
  // Valid use-case for accounts with NO keystore yet set up
  if (!keystoreUid || keystoreUid.length < 21) return ''

  return keystoreUid.substring(10, 21) + (inviteCode || '')
}

/**
 * Tells whether a URL points to an internal Ambire API, i.e. whether it is one of
 * ours to attach the `x-app-*` analytics headers to. Requests to 3rd parties must
 * never carry anything that identifies the app instance.
 */
const isAmbireApiUrl = (url: string): boolean => {
  try {
    const { hostname } = new URL(url)

    return hostname === 'ambire.com' || hostname.endsWith('.ambire.com')
  } catch (error) {
    // A URL we cannot parse is treated as 3rd party, to stay on the safe side
    console.error(error)

    return false
  }
}

const CENA_URL = 'https://cena.ambire.com/'

/**
 * Attaches the account balance to the cena requests, as a hint for our internal
 * analytics. Any cena request will do, because narrowing it down to one route risks
 * catching a moment when the balance is not fully loaded yet.
 */
const attachBalanceHint = (url: string, accountAddr: string, balance: number): string => {
  if (!url.startsWith(CENA_URL)) return url

  // Appended by plain concatenation (instead of URLSearchParams), so that the rest of
  // the url is left exactly as it came in. Decoding the whole url after appending would
  // alter any other param that carries an encoded `&`, `=` or `#`. The hint itself is
  // left unencoded on purpose, because that is the shape the analytics backend expects.
  const panVal = JSON.stringify({ a: accountAddr, b: balance })
  const hashIndex = url.indexOf('#')
  const beforeHash = hashIndex === -1 ? url : url.slice(0, hashIndex)
  const hash = hashIndex === -1 ? '' : url.slice(hashIndex)
  const separator = beforeHash.includes('?') ? '&' : '?'

  return `${beforeHash}${separator}panVal=${panVal}${hash}`
}

export { attachBalanceHint, getAppInstanceId, isAmbireApiUrl }

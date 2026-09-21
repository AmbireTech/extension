/* eslint-disable @typescript-eslint/no-require-imports */
// Loaded here too (not only in ./shared), because this module is also required by
// the unit tests, which never go through the webpack config.
require('dotenv').config()

// The name of the global that the benzin build inlines the relayer network config
// into. Declared for the app side in src/benzin/constants/networks.ts.
const RELAYER_NETWORKS_GLOBAL = '__RELAYER_NETWORKS__'

const RELAYER_NETWORKS_ENDPOINT = '/v2/config/networks'
const FETCH_TIMEOUT = 20000
const LOG_PREFIX = '[benzin networks]'

/**
 * Fetches the relayer network config at build time, so that benzin ships it
 * inlined instead of requesting it on every page load. Returns the networks keyed
 * by chain id, or null when the relayer is unreachable and the build is allowed
 * to continue without it (development only). Throws on a production build, so a
 * deploy never silently ships with benzin falling back to the handful of networks
 * predefined in ambire-common.
 */
async function fetchRelayerNetworks() {
  const { RELAYER_URL, APP_ENV } = process.env
  const isProduction = APP_ENV === 'production'
  const url = RELAYER_URL ? `${RELAYER_URL}${RELAYER_NETWORKS_ENDPOINT}` : null

  try {
    if (!url) throw new Error('RELAYER_URL is not set')

    console.log(`${LOG_PREFIX} Fetching ${url}`)

    const abortController = new AbortController()
    const timeout = setTimeout(() => abortController.abort(), FETCH_TIMEOUT)

    let res
    try {
      res = await fetch(url, { signal: abortController.signal })
    } finally {
      clearTimeout(timeout)
    }

    if (!res.ok) throw new Error(`the relayer responded with ${res.status} ${res.statusText}`)

    const body = await res.json()
    const networks = body?.data?.extensionConfigNetworks

    const chainIds = Object.keys(networks || {})
    if (!chainIds.length) throw new Error('the relayer response contains no networks')

    console.log(
      `${LOG_PREFIX} Inlining ${chainIds.length} networks into the build: ${chainIds.join(', ')}`
    )

    return networks
  } catch (error) {
    const message = `${LOG_PREFIX} Failed to fetch the relayer networks${
      url ? ` from ${url}` : ''
    }: ${error.message}`

    console.error(message)
    if (isProduction) throw new Error(message)

    console.warn(`${LOG_PREFIX} Falling back to the networks predefined in ambire-common`)
    return null
  }
}

module.exports = { fetchRelayerNetworks, RELAYER_NETWORKS_GLOBAL }

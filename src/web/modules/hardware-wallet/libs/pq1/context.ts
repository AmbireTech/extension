// What `pq1-sdk` needs from Ambire: where its clear-signing catalogs are,
// how to reach the Safe Transaction Service and the bundler, how to read a
// chain, and where to report problems. The SDK itself has no Ambire code.

import type { JsonRpcProvider } from 'ethers'
import { createChainReader, createPq1Context, pimlicoBundler, type Pq1Logger } from 'pq1-sdk'
import { extensionCatalogs } from 'pq1-sdk/extension'

import { SAFE_API_TIMEOUT_MS } from '@ambire-common/consts/safe'
import { getApiKit } from '@ambire-common/libs/safe/safe'
import { withTimeout } from '@ambire-common/utils/with-timeout'
import { captureException } from '@common/config/analytics/CrashAnalytics.web'

/** Sends the SDK's warnings to the console and its unexpected errors to
 *  Sentry too: a catalog that stops loading quietly turns every PQ1 request
 *  into blind signing, which we want to hear about. */
export const pq1Logger: Pq1Logger = {
  warn: (message, details) => console.warn(`[pq1] ${message}`, details ?? ''),
  error: (error, context) => {
    console.error('[pq1]', error, context ?? '')
    captureException(error, { extra: context })
  }
}

/** The SDK context of every PQ1 request. The catalogs ship with the
 *  extension (webpack copies them from `pq1-sdk-catalogs` to `pq1/`), so a
 *  lookup never leaves the browser; the device checks every entry against
 *  the roots in its firmware. */
export const pq1Context = createPq1Context({
  catalogs: extensionCatalogs('pq1/'),
  logger: pq1Logger,
  // Safe `approveHash` calls need the transaction they approve, from the
  // same Safe Transaction Service client Ambire uses everywhere else.
  safeTxService: {
    getTransaction: (chainId, safeTxHash) =>
      withTimeout(() => getApiKit(BigInt(chainId)).getTransaction(safeTxHash), {
        timeoutMs: SAFE_API_TIMEOUT_MS,
        message: `Safe API: get transaction timed out after ${SAFE_API_TIMEOUT_MS}ms`
      })
  }
})

/** The chain reads the SDK makes, over Ambire's provider for that chain. */
export const pq1ChainReader = (chainId: bigint, provider: JsonRpcProvider) =>
  createChainReader(Number(chainId), {
    request: ({ method, params }) => provider.send(method, params ?? [])
  })

/** The bundler PQ1 UserOperations go to, or null when this build has no
 *  key for it. It is the same build-time key ambire-common's own Pimlico
 *  bundler reads. */
export const createPq1Bundler = () => {
  const apiKey = process.env.REACT_APP_PIMLICO_API_KEY
  return apiKey ? pimlicoBundler({ apiKey }) : null
}

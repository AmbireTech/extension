import { FetchGetUrlFunc, FetchRequest, GetUrlResponse } from 'ethers'

import type { AnonRpcController } from './anon-rpc'

/**
 * Routes every HTTP request ethers makes in this JS context (all JsonRpcProviders,
 * including the ones ambire-common builds in getRpcProvider) through the anon-rpc
 * controller while it is enabled. While disabled, ethers' own default request
 * function is used, so behaviour is unchanged.
 *
 * Global to the context by design: ethers keeps a single registered getUrl, and a
 * per-provider hook would mean changing every provider ambire-common creates.
 */
export const routeEthersRequestsThroughAnonRpc = (anonRpcCtrl: AnonRpcController) => {
  const defaultGetUrl = FetchRequest.createGetUrlFunc()

  const getUrl: FetchGetUrlFunc = async (req, signal) => {
    if (!(await anonRpcCtrl.isRouting())) return defaultGetUrl(req, signal)

    // Mirrors ethers' default browser getUrl: enforce the request timeout and honour cancellation
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), req.timeout)
    signal?.addListener(() => abortController.abort())

    try {
      const response = await anonRpcCtrl.fetch(req.url, {
        method: req.method,
        headers: req.headers,
        // slice() copies into a plain ArrayBuffer-backed array, which is what BodyInit
        // accepts; JSON-RPC bodies are small, so the copy is negligible
        body: req.body?.slice(),
        signal: abortController.signal
      })

      const headers: GetUrlResponse['headers'] = {}
      response.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value
      })

      return {
        statusCode: response.status,
        statusMessage: response.statusText,
        headers,
        body: new Uint8Array(await response.arrayBuffer())
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  FetchRequest.registerGetUrl(getUrl)
}

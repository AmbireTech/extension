import type { RpcProvider } from '@anon-rpc/browser-extension-harness'

type JsonRpcResponse = {
  result?: unknown
  error?: { code?: number; message?: string }
}

/**
 * The provider anon-rpc reads the specifier contract through (two `eth_call`s on
 * boot). It deliberately uses the native fetch rather than ethers: every ethers
 * request is routed through the anon-rpc worker while the feature is on, so
 * going through ethers here would wait on the very worker this is booting.
 * `rpcUrl` must serve the chain the specifier lives on (see specifierChains).
 */
export const createBootstrapProvider = (rpcUrl: string): RpcProvider => {
  let nextId = 1

  return {
    async request({ method, params }) {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: nextId++, method, params: params ?? [] })
      })
      if (!response.ok) {
        throw new Error(`The RPC used to look up the privacy network replied ${response.status}`)
      }

      const { result, error } = (await response.json()) as JsonRpcResponse
      if (error) {
        throw Object.assign(new Error(error.message || 'RPC error'), { code: error.code })
      }
      return result
    }
  }
}

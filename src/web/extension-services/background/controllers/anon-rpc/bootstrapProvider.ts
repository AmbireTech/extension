import type { RpcProvider } from '@anon-rpc/browser-extension-harness'
import { ETHEREUM_CHAIN_ID, networks } from '@ambire-common/consts/networks'

type JsonRpcResponse = {
  result?: unknown
  error?: { code?: number; message?: string }
}

const MAINNET_RPC_URL = networks.find((network) => network.chainId === ETHEREUM_CHAIN_ID)!
  .rpcUrls[0]!

/**
 * The provider anon-rpc reads the specifier contract through (two `eth_call`s on
 * boot). It deliberately uses the native fetch rather than ethers: every ethers
 * request is routed through the anon-rpc worker while the feature is on, so
 * going through ethers here would wait on the very worker this is booting.
 */
export const createBootstrapProvider = (rpcUrl: string = MAINNET_RPC_URL): RpcProvider => {
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

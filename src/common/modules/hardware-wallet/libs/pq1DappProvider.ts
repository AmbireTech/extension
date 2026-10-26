// Dapp-facing (EIP-1193 / EIP-5792) answers for PQ1 accounts.
//
// PQ1 accounts are smart-contract wallets, but Ambire imports them with
// `creation: null`, so its own account model treats them as plain EOAs. Two
// dapp-facing answers need to differ from that: `eth_getCode` (a wallet not
// deployed on the dapp's chain yet has no code) and `wallet_getCapabilities`
// (every PQ1 wallet batches atomically). The answers come from
// `pq1-sdk/provider`; this module adapts Ambire's keys, chain ids and
// provider to it, so `ProviderController` only needs a hook.

import type { JsonRpcProvider } from 'ethers'
import {
  buildPq1Capabilities as buildSdkPq1Capabilities,
  isPq1AccountCodeQuery as isSdkPq1AccountCodeQuery,
  resolvePq1AccountCode as resolveSdkPq1AccountCode
} from 'pq1-sdk/provider'

import { Key } from '@ambire-common/interfaces/keystore'
import { Network } from '@ambire-common/interfaces/network'

/** True when `addr` is controlled by an imported PQ1 key. */
export const isPq1Key = (keys: Key[], addr: string): boolean =>
  keys.some((k) => k.type === 'pq1' && k.addr.toLowerCase() === addr.toLowerCase())

/** Narrows `eth_getCode` params to `[address, blockTag?]`. */
export const isEthGetCodeParams = (params: unknown): params is [string, ...unknown[]] =>
  Array.isArray(params) && typeof params[0] === 'string'

/**
 * True when `eth_getCode` for `addr` on `chainId` gets the PQ1 answer
 * (`resolvePq1AccountCode`): `addr` is a PQ1 account among the accounts the
 * dapp is connected to, on a PQ1 chain. Every other query goes to the chain
 * unchanged, so the answer tells a site nothing about accounts it isn't
 * connected to.
 */
export const isPq1AccountCodeQuery = (
  keys: Key[],
  connectedAccounts: string[],
  chainId: bigint,
  addr: string
): boolean =>
  isSdkPq1AccountCodeQuery({
    address: addr,
    chainId: Number(chainId),
    connectedAccounts,
    pq1Accounts: keys.filter((k) => k.type === 'pq1').map((k) => k.addr)
  })

/**
 * `eth_getCode` for a connected PQ1 account (see `isPq1AccountCodeQuery`):
 * the chain's code when the wallet is deployed there, otherwise a one-byte
 * stub, so dapps choose their smart-contract-wallet flows for it. A query at
 * a past block always goes to the chain unchanged.
 */
export const resolvePq1AccountCode = (
  provider: JsonRpcProvider,
  params: [string, ...unknown[]]
): Promise<string> =>
  resolveSdkPq1AccountCode(async ({ method, params: requestParams }) => {
    try {
      return await provider.send(method, requestParams ?? [])
    } catch (e) {
      // For the latest block the SDK answers with the stub instead of failing
      // the dapp's request, since a PQ1 account is a smart-contract wallet
      // whatever this read says.
      console.warn('[pq1] eth_getCode failed', e)
      throw e
    }
  }, params)

/** EIP-5792 `wallet_getCapabilities` map for a PQ1 account: atomic batching
 *  on every PQ1 chain, nothing else (no gas tank, no paymaster — PQ1 always
 *  pays gas in the native token from itself). */
export const buildPq1Capabilities = (networks: Network[]) =>
  buildSdkPq1Capabilities(networks.map((network) => Number(network.chainId)))

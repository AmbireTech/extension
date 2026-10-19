// Dapp-facing (EIP-1193 / EIP-5792) answers for PQ1 accounts.
//
// PQ1 accounts are PQSmartWallets — ERC-4337 smart-contract accounts
// deployed via CREATE2 at the same address on every chain in
// `PQ1_SUPPORTED_CHAIN_IDS`. Ambire imports them with `creation: null`, so
// its own account model treats them as plain EOAs. Two dapp-facing answers
// need to differ from that, and `ProviderController` delegates them here so
// the PQ1-specific reasoning stays out of the shared controller:
//
//   - `eth_getCode`: dapps tell a smart-contract wallet from an EOA by
//     whether its code is empty, and a wallet not deployed on the dapp's
//     chain yet has none. See `resolvePq1AccountCode`.
//   - `wallet_getCapabilities`: `getBaseAccount` → EOA → atomic
//     'unsupported', while every PQ1 wallet runs N inner calls atomically
//     in one userOp via `executeBatchWithOffchainCount`. See
//     `buildPq1Capabilities`.

import type { JsonRpcProvider } from 'ethers'

import { Key } from '@ambire-common/interfaces/keystore'
import { Network } from '@ambire-common/interfaces/network'
import { networkChainIdToHex } from '@ambire-common/libs/networks/networks'

import { PQ1_SUPPORTED_CHAIN_IDS } from '@common/modules/hardware-wallet/constants/pq1'

/** Non-empty `eth_getCode` answer for a connected PQ1 account that isn't
 *  deployed on the dapp's chain yet (counterfactual CREATE2 address). A
 *  single INVALID opcode (0xfe) is enough for dapps to treat it as the
 *  smart-contract wallet its first transaction deploys. */
const PQ1_UNDEPLOYED_ACCOUNT_CODE = '0xfe'

/** True when `addr` is controlled by an imported PQ1 key. */
export const isPq1Key = (keys: Key[], addr: string): boolean =>
  keys.some((k) => k.type === 'pq1' && k.addr.toLowerCase() === addr.toLowerCase())

/** Narrows `eth_getCode` params to `[address, blockTag?]`. */
export const isEthGetCodeParams = (params: unknown): params is [string, ...unknown[]] =>
  Array.isArray(params) && typeof params[0] === 'string'

const isLatestBlockTag = (blockTag: unknown) =>
  blockTag === undefined || blockTag === null || blockTag === 'latest' || blockTag === 'pending'

/**
 * True when `eth_getCode` for `addr` on `chainId` gets the PQ1 answer
 * (`resolvePq1AccountCode`): `addr` is a PQ1 account among the accounts the
 * dapp is connected to, on a chain PQ1 wallets can be deployed on. Every
 * other query goes to the chain unchanged, so the answer tells a site
 * nothing about accounts it isn't connected to.
 */
export const isPq1AccountCodeQuery = (
  keys: Key[],
  connectedAccounts: string[],
  chainId: bigint,
  addr: string
): boolean =>
  PQ1_SUPPORTED_CHAIN_IDS.includes(Number(chainId)) &&
  connectedAccounts.some((account) => account.toLowerCase() === addr.toLowerCase()) &&
  isPq1Key(keys, addr)

/**
 * `eth_getCode` for a connected PQ1 account (see `isPq1AccountCodeQuery`):
 *   - a query at a past block goes to the chain unchanged, since chain state
 *     at a past block must never be made up;
 *   - otherwise the chain's code, when the wallet is deployed there;
 *   - when it isn't yet, the one-byte stub (`PQ1_UNDEPLOYED_ACCOUNT_CODE`),
 *     so dapps choose their smart-contract-wallet flows for it. Until it is
 *     deployed, its signatures are ERC-6492 ones, which a dapp that follows
 *     ERC-6492 verifies whatever `eth_getCode` said.
 */
export async function resolvePq1AccountCode(
  provider: JsonRpcProvider,
  params: [string, ...unknown[]]
): Promise<string> {
  const [, blockTag] = params
  if (!isLatestBlockTag(blockTag)) return provider.send('eth_getCode', params)

  try {
    const code = await provider.send('eth_getCode', params)
    if (code && code !== '0x') return code
  } catch (e) {
    // A connected PQ1 account is a smart-contract wallet whatever this read
    // says, so a failed read gets the stub instead of failing the dapp's
    // request.
    console.warn('[pq1] eth_getCode failed, answering with the undeployed stub', e)
  }
  return PQ1_UNDEPLOYED_ACCOUNT_CODE
}

/**
 * EIP-5792 `wallet_getCapabilities` map for a PQ1 account: atomic batching
 * on every chain the wallet is deployable on, nothing else (no gas tank,
 * no paymaster — PQ1 always pays gas in the native token from itself).
 * Same per-chain entry shape as the generic branch in `ProviderController`.
 */
export const buildPq1Capabilities = (networks: Network[]) => {
  const capabilities: Record<string, unknown> = {}
  networks.forEach((network) => {
    const supported = PQ1_SUPPORTED_CHAIN_IDS.includes(Number(network.chainId))
    capabilities[networkChainIdToHex(network.chainId)] = {
      atomicBatch: { supported },
      auxiliaryFunds: { supported: false },
      paymasterService: { supported: false },
      atomic: { status: supported ? 'supported' : 'unsupported' }
    }
  })
  return capabilities
}

import { ETHEREUM_CHAIN_ID, networks } from '@ambire-common/consts/networks'

/**
 * A chain a privacy network's specifier contract may live on, with the RPC used
 * to read it when booting (two `eth_call`s). This is where the specifier is
 * looked up, not which chains the anonymized requests can reach.
 */
export type SpecifierChain = {
  chainId: number
  name: string
  rpcUrl: string
}

const MAINNET_RPC_URL = networks.find((network) => network.chainId === ETHEREUM_CHAIN_ID)!
  .rpcUrls[0]!

/**
 * The chains a specifier can be read from, each through Ambire's own RPC. Sepolia
 * is listed because published networks deploy specifiers there (Nox); the
 * Sepolia RPC in the testnet network config needs an Alchemy key most builds
 * don't have, so the key-less Ambire endpoint is used instead.
 */
export const SPECIFIER_CHAINS: SpecifierChain[] = [
  { chainId: Number(ETHEREUM_CHAIN_ID), name: 'Ethereum', rpcUrl: MAINNET_RPC_URL },
  { chainId: 11155111, name: 'Sepolia', rpcUrl: 'https://invictus.ambire.com/sepolia' }
]

/** The chain a specifier lives on when a network doesn't say (as in anon-rpc's adopters list). */
export const DEFAULT_SPECIFIER_CHAIN_ID = Number(ETHEREUM_CHAIN_ID)

export const findSpecifierChain = (chainId: number): SpecifierChain | null =>
  SPECIFIER_CHAINS.find((chain) => chain.chainId === chainId) ?? null

/** Whether a network's `chainId` field (absent meaning Ethereum) is one a specifier can be read from. */
export const isSupportedSpecifierChainId = (value: unknown): value is number | undefined =>
  value === undefined || (typeof value === 'number' && !!findSpecifierChain(value))

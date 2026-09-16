import { ETHEREUM_CHAIN_ID } from '@ambire-common/consts/networks'

const WALLET_STAKING_CATEGORIES = new Set(['services', 'staking', 'staking pool', 'yield'])

/** Returns whether the Wallet Staking app matches the selected Explore filters. */
export const shouldShowWalletStaking = (
  networkChainId: bigint | null,
  category: string | null
): boolean =>
  (networkChainId === null || networkChainId === ETHEREUM_CHAIN_ID) &&
  (category === null || WALLET_STAKING_CATEGORIES.has(category.toLowerCase()))

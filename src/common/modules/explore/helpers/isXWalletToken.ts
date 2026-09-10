import { WALLET_STAKING_ADDR } from '@ambire-common/consts/addresses'
import { ETHEREUM_CHAIN_ID } from '@ambire-common/consts/networks'

import type { TokenResult } from '@ambire-common/libs/portfolio'

/** Returns whether the token is the legacy xWALLET token on Ethereum. */
export const isXWalletToken = ({ chainId, address }: Pick<TokenResult, 'chainId' | 'address'>) =>
  chainId === ETHEREUM_CHAIN_ID && address.toLowerCase() === WALLET_STAKING_ADDR.toLowerCase()

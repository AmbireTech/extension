import { formatUnits } from 'ethers'

import {
  getPrivacyPoolsTokenId,
  PRIVACY_POOLS_DEPOSIT_CHIPS
} from '@ambire-common/consts/privacyPools'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import compareBigInts from '@ambire-common/utils/numbers/compareBigInts'

/** A Privacy Pools amount as the user reads it, without its symbol, like "0.1". */
const formatPrivacyPoolsAmountNumber = (amount: bigint, decimals: number): string =>
  formatDecimals(Number(formatUnits(amount, decimals)), 'amount')

/** A Privacy Pools amount as the user reads it, with its symbol, like "0.1 ETH". */
const formatPrivacyPoolsAmount = (amount: bigint, decimals: number, symbol: string): string =>
  `${formatPrivacyPoolsAmountNumber(amount, decimals)} ${symbol}`

/**
 * The amounts to suggest for a Privacy Pools transfer of a token, smallest first: the pool's common
 * amounts, plus `extraAmounts` like those that send whole deposits. Empty for a token with none.
 */
const getPrivacyPoolsSuggestedAmounts = (
  chainId: string,
  tokenAddress: string,
  extraAmounts: bigint[] = []
): bigint[] => {
  const commonAmounts =
    PRIVACY_POOLS_DEPOSIT_CHIPS[getPrivacyPoolsTokenId(chainId, tokenAddress)] ?? []
  const uniqueAmounts = new Set([...commonAmounts, ...extraAmounts])

  return [...uniqueAmounts].sort(compareBigInts)
}

export { formatPrivacyPoolsAmount, formatPrivacyPoolsAmountNumber, getPrivacyPoolsSuggestedAmounts }

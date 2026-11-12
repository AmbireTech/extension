import { formatUnits } from 'ethers'

import {
  getPrivacyPoolsTokenId,
  PRIVACY_POOLS_DEPOSIT_CHIPS
} from '@ambire-common/consts/privacyPools'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'

/** A Privacy Pools amount as the user reads it, without its symbol, like "0.1". */
const formatPrivacyPoolsAmountNumber = (amount: bigint, decimals: number): string =>
  formatDecimals(Number(formatUnits(amount, decimals)), 'amount')

/** A Privacy Pools amount as the user reads it, with its symbol, like "0.1 ETH". */
const formatPrivacyPoolsAmount = (amount: bigint, decimals: number, symbol: string): string =>
  `${formatPrivacyPoolsAmountNumber(amount, decimals)} ${symbol}`

/**
 * The common deposit amounts to suggest for a Privacy Pools transfer of a token, smallest first.
 * Empty for a token with none.
 */
const getPrivacyPoolsSuggestedAmounts = (chainId: string, tokenAddress: string): bigint[] =>
  PRIVACY_POOLS_DEPOSIT_CHIPS[getPrivacyPoolsTokenId(chainId, tokenAddress)] ?? []

export { formatPrivacyPoolsAmount, formatPrivacyPoolsAmountNumber, getPrivacyPoolsSuggestedAmounts }

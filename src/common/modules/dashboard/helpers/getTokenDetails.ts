import { formatUnits } from 'ethers'

import { Network } from '@ambire-common/interfaces/network'
import { SelectedAccountPortfolioTokenResult } from '@ambire-common/interfaces/selectedAccount'
import { AccountOp } from '@ambire-common/libs/accountOp/accountOp'
import { FormattedPendingAmounts, PendingAmounts } from '@ambire-common/libs/portfolio/interfaces'
import { calculatePendingAmounts } from '@ambire-common/libs/portfolio/pendingAmountsHelper'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import { safeTokenAmountAndNumberMultiplication } from '@ambire-common/utils/numbers/formatters'

/**
 * Formats pending token amounts in a better readable format, including converting
 * the amounts to human-readable strings and calculating their USD value.
 */
const formatPendingAmounts = (
  pendingAmounts: PendingAmounts | null,
  decimals: number,
  priceUSD: number
): FormattedPendingAmounts | null => {
  if (!pendingAmounts) return null

  const pendingBalance = formatUnits(pendingAmounts.pendingBalance, decimals)
  const pendingBalanceUSD =
    priceUSD && pendingAmounts.pendingBalance
      ? safeTokenAmountAndNumberMultiplication(pendingAmounts.pendingBalance, decimals, priceUSD)
      : undefined
  const formattedAmounts: FormattedPendingAmounts = {
    ...pendingAmounts,
    pendingBalance,
    pendingBalanceFormatted: formatDecimals(Number(pendingBalance), 'amount')
  }

  if (pendingBalanceUSD) {
    formattedAmounts.pendingBalanceUSDFormatted = formatDecimals(Number(pendingBalanceUSD), 'value')
  }

  if (pendingAmounts.pendingToBeSigned) {
    formattedAmounts.pendingToBeSignedFormatted = formatDecimals(
      parseFloat(formatUnits(pendingAmounts.pendingToBeSigned, decimals)),
      'amount'
    )
  }

  if (pendingAmounts.pendingToBeConfirmed) {
    formattedAmounts.pendingToBeConfirmedFormatted = formatDecimals(
      parseFloat(formatUnits(pendingAmounts.pendingToBeConfirmed, decimals)),
      'amount'
    )
  }

  return formattedAmounts
}

/**
 * Calculates and formats (for display) token details including balance, price
 * in USD, pending amounts and other details.
 */
const getAndFormatTokenDetails = (
  {
    flags: { rewardsType },
    networkId,
    priceIn,
    latestAmount,
    pendingAmount,
    amount,
    decimals,
    amountPostSimulation,
    simulationAmount
  }: SelectedAccountPortfolioTokenResult,
  networks: Network[],
  simulatedAccountOp?: AccountOp
) => {
  const isRewards = rewardsType === 'wallet-rewards'
  const isVesting = rewardsType === 'wallet-vesting'
  const networkData = networks.find(({ id }) => networkId === id)
  const amountish = BigInt(amount)
  const amountishLatest = BigInt(latestAmount || 0n)

  const balance = parseFloat(formatUnits(amountish, decimals))
  const balanceLatest = parseFloat(formatUnits(amountishLatest, decimals))
  const priceUSD = priceIn.find(
    ({ baseCurrency }: { baseCurrency: string }) => baseCurrency.toLowerCase() === 'usd'
  )?.price
  const balanceUSD = priceUSD
    ? Number(safeTokenAmountAndNumberMultiplication(amountish, decimals, priceUSD))
    : undefined

  const pendingAmountsFormatted = formatPendingAmounts(
    calculatePendingAmounts(
      latestAmount || 0n,
      pendingAmount || 0n,
      amountPostSimulation,
      simulationAmount,
      simulatedAccountOp
    ),
    decimals,
    priceUSD!
  )

  // 1. This function will be moved to portfolioView.
  // 2. balance, priceUSD and balanceUSD are numbers while values in pendingAmountsFormatted
  // are strings. Please decide on the type of the values when refactoring.
  return {
    balance,
    balanceFormatted: formatDecimals(balance, 'amount'),
    balanceLatestFormatted: formatDecimals(balanceLatest, 'amount'),
    priceUSD,
    priceUSDFormatted: formatDecimals(priceUSD, 'price'),
    balanceUSD,
    balanceUSDFormatted: formatDecimals(balanceUSD, 'value'),
    networkData,
    isRewards,
    isVesting,
    ...pendingAmountsFormatted
  }
}

export default getAndFormatTokenDetails

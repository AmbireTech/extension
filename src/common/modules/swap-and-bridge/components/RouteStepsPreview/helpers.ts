import { formatUnits } from 'ethers'

import type {
  SwapAndBridgeActiveRoute,
  SwapAndBridgeRoute
} from '@ambire-common/interfaces/swapAndBridge'
import formatDecimals, { FormatType } from '@ambire-common/utils/formatDecimals/formatDecimals'

export type RouteStepType = 'default' | 'warning' | 'success'

const getPositiveFiniteNumber = (value: number) =>
  Number.isFinite(value) && value > 0 ? value : undefined

/**
 * The network fee estimated by the provider, derived from the gap between the route's
 * output value and its output value after gas. This is the same gas cost the route
 * sorting subtracts, so it explains why a route with fewer tokens can rank higher.
 * Returns `undefined` when the provider doesn't send an estimate.
 */
export const getRouteNetworkFeeInUsd = (
  route: Pick<SwapAndBridgeRoute, 'outputValueInUsd' | 'outputValueAfterGasInUsd'>
): number | undefined => {
  if (route.outputValueAfterGasInUsd === undefined) return undefined

  return getPositiveFiniteNumber(route.outputValueInUsd - route.outputValueAfterGasInUsd)
}

const getPositiveBigInt = (value: string) => {
  try {
    const parsedValue = BigInt(value)

    return parsedValue > 0n ? parsedValue : undefined
  } catch {
    return undefined
  }
}

// Below this, `formatDecimals(..., 'value')` shows "<$0.01" instead of the amount
const MIN_DISPLAYED_USD_VALUE = 0.01

/**
 * Formats a fee in USD to 2 decimals, showing very small fees (common on L2s) as "<$0.01"
 * instead of e.g. "$0.0012". `isApproximate` is false for those, as "<$0.01" is already
 * a bound and shouldn't get a "~" prefix.
 */
export const formatFeeInUsd = (amountInUsd: number) => ({
  formattedAmount: formatDecimals(amountInUsd, 'value'),
  isApproximate: amountInUsd >= MIN_DISPLAYED_USD_VALUE
})

/**
 * Formats an amount of the route's receiving token, e.g. "0.0091245 WBTC". Pass the
 * `amount` format type to keep only 2 decimals after the first non-zero one, e.g. "1.64 USDC".
 */
export const formatRouteToTokenAmount = (
  amount: bigint,
  toToken: Pick<SwapAndBridgeRoute['toToken'], 'decimals' | 'symbol'>,
  formatType: Extract<FormatType, 'precise' | 'amount'> = 'precise'
) =>
  `${formatDecimals(Number(formatUnits(amount, toToken.decimals)), formatType)} ${toToken.symbol}`

/**
 * The network fee taken from the received tokens, in the receiving token's smallest unit.
 * Only providers that don't charge the network fee to the account (CoW Swap) set it.
 */
export const getRouteNetworkFeeInToToken = (
  route: Pick<SwapAndBridgeRoute, 'networkFeeInToToken'>
): bigint | undefined => {
  if (route.networkFeeInToToken === undefined) return undefined

  return getPositiveBigInt(route.networkFeeInToToken)
}

/**
 * The least the user receives, in the receiving token's smallest unit. Read from the last
 * user tx, the same way the slippage warning reads it.
 */
export const getRouteMinReceiveAmount = (
  route: Pick<SwapAndBridgeRoute, 'userTxs'>
): bigint | undefined => {
  const lastUserTx = route.userTxs[route.userTxs.length - 1]
  if (!lastUserTx) return undefined

  return getPositiveBigInt(lastUserTx.minAmountOut)
}

// EVM native assets are always denominated in wei
const NATIVE_ASSET_DECIMALS = 18

/**
 * Formats the extra fee some bridges charge in the source chain's native token, on top of
 * the sent amount, e.g. "0.00012 ETH". Routes with this fee are sorted below the ones
 * without it. Falls back to an explicit USD amount (e.g. "$0.42") when the native token
 * symbol isn't known, so the fee is never shown as a bare, ambiguous number.
 */
export const getRouteExtraBridgeFeeLabel = (
  route: Pick<SwapAndBridgeRoute, 'serviceFee'>,
  nativeSymbol?: string
): string | undefined => {
  if (!route.serviceFee) return undefined

  const amount = getPositiveBigInt(route.serviceFee.amount)
  if (amount && nativeSymbol) {
    return `${formatDecimals(
      Number(formatUnits(amount, NATIVE_ASSET_DECIMALS)),
      'precise'
    )} ${nativeSymbol}`
  }

  const amountInUsd = getPositiveFiniteNumber(Number(route.serviceFee.amountUSD))

  return amountInUsd ? formatDecimals(amountInUsd, 'price') : undefined
}

/** Determines the final arrow state without treating a pending single-step route as completed. */
export const getLastRouteStepType = ({
  routeStatus,
  userTxIndex,
  currentStep,
  isOnlyOneStep
}: {
  routeStatus?: SwapAndBridgeActiveRoute['routeStatus']
  userTxIndex: number
  currentStep: number
  isOnlyOneStep: boolean
}): RouteStepType => {
  if (routeStatus === 'completed') return 'success'

  if (isOnlyOneStep && routeStatus) {
    return routeStatus === 'refunded' ? 'warning' : 'default'
  }

  if (userTxIndex < currentStep) {
    return routeStatus === 'refunded' ? 'warning' : 'success'
  }

  return 'default'
}

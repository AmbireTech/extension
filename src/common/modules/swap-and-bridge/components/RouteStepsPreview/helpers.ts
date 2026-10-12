import type {
  SwapAndBridgeActiveRoute,
  SwapAndBridgeRoute
} from '@ambire-common/interfaces/swapAndBridge'

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

/**
 * The extra fee some bridges charge in the source chain's native token, on top of the
 * sent amount. Routes with this fee are sorted below the ones without it.
 */
export const getRouteExtraBridgeFeeInUsd = (
  route: Pick<SwapAndBridgeRoute, 'serviceFee'>
): number | undefined => {
  if (!route.serviceFee) return undefined

  return getPositiveFiniteNumber(Number(route.serviceFee.amountUSD))
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

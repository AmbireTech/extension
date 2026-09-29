import type { SwapAndBridgeActiveRoute } from '@ambire-common/interfaces/swapAndBridge'

export type RouteStepType = 'default' | 'warning' | 'success'

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

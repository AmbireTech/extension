import { useCallback, useMemo } from 'react'

import {
  getPendingDeliveries,
  getPendingDeliveryKey,
  PendingDelivery
} from '@ambire-common/libs/swapAndBridge/pendingDeliveries'
import useController from '@common/hooks/useController'

import type { TokenResult } from '@ambire-common/libs/portfolio'
import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectAccountAddr = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account?.addr
const selectActiveRoutes = (state: AllControllersMappingType['SwapAndBridgeController']) =>
  state.activeRoutes

/**
 * The token amounts that the selected account's in-progress swaps and bridges will still move
 * after their transactions were mined (see `getPendingDeliveries`).
 * Returns a getter of what is on its way for a token, `undefined` when nothing is.
 */
const usePendingDeliveries = () => {
  const { state: accountAddr } = useController('SelectedAccountController', selectAccountAddr)
  const { state: activeRoutes } = useController('SwapAndBridgeController', selectActiveRoutes)

  const pendingDeliveries = useMemo(
    () => (accountAddr ? getPendingDeliveries(activeRoutes, accountAddr) : {}),
    [activeRoutes, accountAddr]
  )

  const getTokenPendingDelivery = useCallback(
    (token: Pick<TokenResult, 'chainId' | 'address'>): PendingDelivery | undefined => {
      const pendingDelivery = pendingDeliveries[getPendingDeliveryKey(token.chainId, token.address)]
      // Routes that cancel each other out (e.g. a bridge in and a CoW Swap order out) leave nothing pending
      if (!pendingDelivery?.amount) return undefined

      return pendingDelivery
    },
    [pendingDeliveries]
  )

  return { pendingDeliveries, getTokenPendingDelivery }
}

export default usePendingDeliveries

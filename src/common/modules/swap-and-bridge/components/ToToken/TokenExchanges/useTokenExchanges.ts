import { useCallback } from 'react'

import { ToTokenMarketData } from '@ambire-common/interfaces/swapAndBridge'
import { getTokenMarketDataKey } from '@ambire-common/libs/swapAndBridge/tokenMarketData'
import useController from '@common/hooks/useController'

import type { IFeatureFlagsController } from '@ambire-common/interfaces/featureFlags'
import type { SwapAndBridgeController } from '@ambire-common/controllers/swapAndBridge/swapAndBridge'

const selectIsTokenInfoEnabled = (state: IFeatureFlagsController) =>
  state.flags?.swapAndBridgeTokenInfo

// One shared object, so a row of a token still loading keeps the same data between renders
const LOADING_MARKET_DATA: ToTokenMarketData = Object.freeze({ status: 'LOADING' })

/**
 * The exchange data of a "to" token. Tokens the controller hasn't fetched yet are absent
 * from its state, which means the same thing for the UI as an explicitly loading one.
 * Returns null when the user has opted out of the feature, so that nothing is rendered
 * for it at all - not even a loading state, as nothing is going to be fetched.
 *
 * Every row of the "to" token list calls this, so it subscribes to its own token's entry
 * only: the data arrives token by token, and a subscription to the whole map re-rendered
 * every row on each arrival.
 */
const useTokenExchanges = (chainId: number, address: string): ToTokenMarketData | null => {
  const { state: isTokenInfoEnabled } = useController(
    'FeatureFlagsController',
    selectIsTokenInfoEnabled
  )
  const marketDataKey = getTokenMarketDataKey(chainId, address)
  const selectTokenMarketData = useCallback(
    (state: SwapAndBridgeController) => state.toTokenMarketData[marketDataKey],
    [marketDataKey]
  )
  const { state: marketData } = useController('SwapAndBridgeController', selectTokenMarketData)

  if (!isTokenInfoEnabled) return null

  return marketData || LOADING_MARKET_DATA
}

export default useTokenExchanges

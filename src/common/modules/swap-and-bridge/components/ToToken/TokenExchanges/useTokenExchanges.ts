import { ToTokenMarketData } from '@ambire-common/interfaces/swapAndBridge'
import { getTokenMarketDataKey } from '@ambire-common/libs/swapAndBridge/tokenMarketData'
import useController from '@common/hooks/useController'

import type { SwapAndBridgeController } from '@ambire-common/controllers/swapAndBridge/swapAndBridge'

const selectToTokenMarketData = (state: SwapAndBridgeController) => state.toTokenMarketData

/**
 * The exchange data of a "to" token. Tokens the controller hasn't fetched yet are absent
 * from its state, which means the same thing for the UI as an explicitly loading one.
 * Returns null when the user has opted out of the feature, so that nothing is rendered
 * for it at all - not even a loading state, as nothing is going to be fetched.
 */
const useTokenExchanges = (chainId: number, address: string): ToTokenMarketData | null => {
  const {
    state: { flags }
  } = useController('FeatureFlagsController')
  const { state: marketDataByToken } = useController(
    'SwapAndBridgeController',
    selectToTokenMarketData
  )

  if (!flags.swapAndBridgeTokenInfo) return null

  return marketDataByToken[getTokenMarketDataKey(chainId, address)] || { status: 'LOADING' }
}

export default useTokenExchanges

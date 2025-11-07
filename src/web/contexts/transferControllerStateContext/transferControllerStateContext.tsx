import React, { createContext, useEffect, useMemo } from 'react'

import { ITransferController } from '@ambire-common/interfaces/transfer'
import { TokenResult } from '@ambire-common/libs/portfolio'
import { getTokenAmount } from '@ambire-common/libs/portfolio/helpers'
import { sortPortfolioTokenList } from '@ambire-common/libs/swapAndBridge/swapAndBridge'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useControllerState from '@web/hooks/useControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'

type ContextReturn = {
  state: ITransferController
  tokens: TokenResult[]
}

const TransferControllerStateContext = createContext<ContextReturn>({} as ContextReturn)

export const getInfoFromSearch = (search: string | undefined) => {
  if (!search) return null

  const params = new URLSearchParams(search)

  return {
    addr: params.get('address'),
    chainId: params.get('chainId')
  }
}

const TransferControllerStateProvider = ({ children }: { children: any }) => {
  const controller = 'transfer'
  const state = useControllerState(controller)
  const { dispatch } = useBackgroundService()
  const mainState = useMainControllerState()
  const isTopUp = state?.isTopUp

  useEffect(() => {
    if (!Object.keys(state).length) {
      dispatch({ type: 'INIT_CONTROLLER_STATE', params: { controller } })
    }
  }, [dispatch, mainState.isReady, state])

  const memoizedState = useDeepMemo(state, controller)

  const { networks } = useNetworksControllerState()
  const { portfolio } = useSelectedAccountControllerState()

  const rawTokens = useMemo(() => {
    if (!networks || !portfolio?.tokens) return []

    return sortPortfolioTokenList(
      portfolio.tokens.filter((token) => {
        const hasAmount = Number(getTokenAmount(token)) > 0

        if (isTopUp) {
          const tokenNetwork = networks.find((network) => network.chainId === token.chainId)

          return (
            hasAmount &&
            tokenNetwork?.hasRelayer &&
            token.flags.canTopUpGasTank &&
            !token.flags.onGasTank
          )
        }

        return hasAmount && !token.flags.onGasTank && !token.flags.rewardsType
      })
    )
  }, [portfolio?.tokens, networks, isTopUp])

  // This ensures that `tokens` won't trigger re-renders unless its deep content changes
  const tokens = useDeepMemo(rawTokens, 'tokens')

  const updatedSelectedToken = useMemo(() => {
    return tokens.find(
      (token) =>
        token.address === memoizedState.selectedToken?.address &&
        token.chainId === memoizedState.selectedToken?.chainId
    )
  }, [tokens, memoizedState.selectedToken?.address, memoizedState.selectedToken?.chainId])

  // If a token is already selected, we should retrieve its latest value from tokens.
  // This is important because the token amount is likely to change,
  // especially when initiating a transfer or adding a new one to the queue.
  // As a result, the token `amountPostSimulation` may differ, and we need to update the available token balance accordingly.
  useEffect(() => {
    if (!memoizedState.isInitialized || !updatedSelectedToken) return

    dispatch({
      type: 'TRANSFER_CONTROLLER_UPDATE_FORM',
      params: { formValues: { selectedToken: updatedSelectedToken } }
    })
  }, [memoizedState.isInitialized, updatedSelectedToken, dispatch])

  return (
    <TransferControllerStateContext.Provider
      value={useMemo(() => ({ state: memoizedState, tokens }), [memoizedState, tokens])}
    >
      {children}
    </TransferControllerStateContext.Provider>
  )
}

export { TransferControllerStateProvider, TransferControllerStateContext }

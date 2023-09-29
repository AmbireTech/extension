import { PortfolioController } from 'ambire-common/src/controllers/portfolio/portfolio'
import {
  AccountState,
  CollectionResult as CollectionResultInterface,
  PortfolioController as PortfolioControllerState,
  PortfolioGetResult,
  TokenResult as TokenResultInterface
} from 'ambire-common/src/libs/portfolio/interfaces'
import { calculateAccountPortfolio } from 'ambire-common/src/libs/portfolio/portfolioView'
import React, { createContext, useEffect, useMemo, useRef, useState } from 'react'

import eventBus from '@web/extension-services/event/eventBus'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useMainControllerState from '@web/hooks/useMainControllerState'

interface AccountPortfolio {
  tokens: TokenResultInterface[]
  collections: CollectionResultInterface[]
  totalAmount: number
  isAllReady: boolean
}
const PortfolioControllerStateContext = createContext<{
  accountPortfolio: AccountPortfolio | null
  state: PortfolioControllerState
  startedLoading: null | number
}>({
  accountPortfolio: {
    tokens: [],
    collections: [],
    totalAmount: 0,
    isAllReady: false
  },
  state: {} as any,
  startedLoading: null
})

const PortfolioControllerStateProvider: React.FC<any> = ({ children }) => {
  const { dispatch } = useBackgroundService()
  const mainCtrl = useMainControllerState()
  const [accountPortfolio, setAccountPortfolio] = useState<AccountPortfolio>({
    tokens: [],
    collections: [],
    totalAmount: 0,
    isAllReady: false
  })
  const [startedLoading, setStartedLoading] = useState(null)
  const [state, setState] = useState({} as PortfolioControllerState)
  const prevAccountPortfolio = useRef<AccountPortfolio>({
    tokens: [],
    collections: [],
    totalAmount: 0,
    isAllReady: false
  })

  useEffect(() => {
    if (mainCtrl.isReady && !Object.keys(state).length) {
      dispatch({
        type: 'INIT_CONTROLLER_STATE',
        params: { controller: 'portfolio' }
      })
    }
  }, [dispatch, mainCtrl.isReady, state])

  useEffect(() => {
    // Set an initial empty state for accountPortfolio
    setAccountPortfolio({
      tokens: [],
      collections: [],
      totalAmount: 0,
      isAllReady: false
    })
    prevAccountPortfolio.current = {
      tokens: [],
      collections: [],
      totalAmount: 0,
      isAllReady: false
    }
    setStartedLoading(null)
  }, [mainCtrl.selectedAccount])

  useEffect(() => {
    if (!mainCtrl.selectedAccount) return

    const newAccountPortfolio = calculateAccountPortfolio(
      mainCtrl.selectedAccount,
      state,
      prevAccountPortfolio?.current
    )

    if (newAccountPortfolio.isAllReady || !prevAccountPortfolio?.current?.tokens.length) {
      setAccountPortfolio(newAccountPortfolio)
      prevAccountPortfolio.current = newAccountPortfolio
    }
  }, [mainCtrl.selectedAccount, state])

  useEffect(() => {
    const onUpdate = (newState: { latest: PortfolioControllerState }) => {
      Object.values(newState?.latest[mainCtrl.selectedAccount]).forEach((network: any) => {
        if (
          network?.result?.updateStarted &&
          (!startedLoading || network?.result?.updateStarted < startedLoading)
        ) {
          setStartedLoading(network.result.updateStarted)
        }
      })
      setState(newState)
    }

    eventBus.addEventListener('portfolio', onUpdate)

    return () => eventBus.removeEventListener('portfolio', onUpdate)
  }, [mainCtrl.selectedAccount, startedLoading])

  return (
    <PortfolioControllerStateContext.Provider
      value={useMemo(
        () => ({
          state,
          accountPortfolio,
          startedLoading
        }),
        [state, accountPortfolio, startedLoading]
      )}
    >
      {children}
    </PortfolioControllerStateContext.Provider>
  )
}

export { PortfolioControllerStateProvider, PortfolioControllerStateContext }

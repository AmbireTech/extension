import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { PortfolioController } from '@ambire-common/controllers/portfolio/portfolio'
import { CustomToken } from '@ambire-common/libs/portfolio/customToken'
import {
  CollectionResult as CollectionResultInterface,
  TokenResult as TokenResultInterface
} from '@ambire-common/libs/portfolio/interfaces'
import { calculateAccountPortfolio } from '@ambire-common/libs/portfolio/portfolioView'
import eventBus from '@web/extension-services/event/eventBus'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useMainControllerState from '@web/hooks/useMainControllerState'

export interface AccountPortfolio {
  tokens: TokenResultInterface[]
  collections: CollectionResultInterface[]
  totalAmount: number
  isAllReady: boolean
}
const PortfolioControllerStateContext = createContext<{
  accountPortfolio: AccountPortfolio | null
  state: PortfolioController
  startedLoading: null | number
  refreshPortfolio: () => void
  updateAdditionalHints: (tokenIds: CustomToken['address'][]) => void
  updateTokenPreferences: (token: CustomToken) => void
  removeTokenPreferences: (tokenAddr: CustomToken['address']) => void
}>({
  accountPortfolio: {
    tokens: [],
    collections: [],
    totalAmount: 0,
    isAllReady: false
  },
  state: {} as any,
  startedLoading: null,
  refreshPortfolio: () => {},
  updateAdditionalHints: () => {},
  updateTokenPreferences: () => {},
  removeTokenPreferences: () => {}
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
  const [state, setState] = useState({} as PortfolioController)
  const prevAccountPortfolio = useRef<AccountPortfolio>({
    tokens: [],
    collections: [],
    totalAmount: 0,
    isAllReady: false
  })

  useEffect(() => {
    if (!Object.keys(state).length) {
      dispatch({
        type: 'INIT_CONTROLLER_STATE',
        params: { controller: 'portfolio' }
      })
    }
  }, [dispatch, state])

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
    if (Object.keys(state?.latest || {}).length && mainCtrl?.selectedAccount) {
      Object.values(state?.latest[mainCtrl.selectedAccount as string] || {}).forEach(
        (network: any) => {
          if (
            network?.result?.updateStarted &&
            (!startedLoading || network?.result?.updateStarted < startedLoading)
          ) {
            setStartedLoading(network.result.updateStarted)
          }
        }
      )
    }
  }, [state?.latest, mainCtrl.selectedAccount, startedLoading])

  useEffect(() => {
    const onUpdate = (newState: PortfolioController) => {
      setState(newState)
    }

    eventBus.addEventListener('portfolio', onUpdate)

    return () => eventBus.removeEventListener('portfolio', onUpdate)
  }, [])

  const updateAdditionalHints = useCallback(
    (tokenIds: any[]) => {
      dispatch({
        type: 'MAIN_CONTROLLER_UPDATE_SELECTED_ACCOUNT',
        params: {
          forceUpdate: true,
          additionalHints: tokenIds
        }
      })
    },
    [dispatch]
  )

  const updateTokenPreferences = useCallback(
    async (token: any) => {
      const tokenPreferences = state?.tokenPreferences
      const tokenIsNotInPreferences = !tokenPreferences.find(
        ({ address }) => address === token.address
      )
      if (tokenIsNotInPreferences) {
        tokenPreferences.push(token)
      } else {
        tokenPreferences.map((t: any) => {
          if (t.address === token.address) {
            t = token
          }
          return t
        })
      }
      dispatch({
        type: 'PORTFOLIO_CONTROLLER_UPDATE_TOKEN_PREFERENCES',
        params: {
          tokenPreferences
        }
      })
    },
    [dispatch, state?.tokenPreferences]
  )

  const removeTokenPreferences = useCallback(
    (tokenAddr: any) => {
      const tokenPreferences = state?.tokenPreferences
      const tokenIsNotInPreferences = tokenPreferences.find(({ address }) => address === tokenAddr)
      if (!tokenIsNotInPreferences) return
      const newTokenPreferences = tokenPreferences.filter(({ address }) => address === !tokenAddr)

      dispatch({
        type: 'PORTFOLIO_CONTROLLER_UPDATE_TOKEN_PREFERENCES',
        params: {
          tokenPreferences: newTokenPreferences
        }
      })
    },
    [dispatch, state?.tokenPreferences]
  )

  const checkToken = useCallback(
    (token: any) => {
      dispatch({
        type: 'PORTFOLIO_CONTROLLER_CHECK_TOKEN',
        params: {
          token
        }
      })
    },
    [dispatch, mainCtrl]
  )

  const refreshPortfolio = useCallback(() => {
    dispatch({
      type: 'MAIN_CONTROLLER_UPDATE_SELECTED_ACCOUNT',
      params: {
        forceUpdate: true
      }
    })
    setAccountPortfolio({ ...accountPortfolio, isAllReady: false } as any)
  }, [dispatch, accountPortfolio, setAccountPortfolio])

  return (
    <PortfolioControllerStateContext.Provider
      value={useMemo(
        () => ({
          state,
          accountPortfolio,
          refreshPortfolio,
          startedLoading,
          updateTokenPreferences,
          updateAdditionalHints,
          removeTokenPreferences,
          checkToken
        }),
        [
          state,
          accountPortfolio,
          startedLoading,
          refreshPortfolio,
          updateTokenPreferences,
          updateAdditionalHints,
          removeTokenPreferences,
          checkToken
        ]
      )}
    >
      {children}
    </PortfolioControllerStateContext.Provider>
  )
}

export { PortfolioControllerStateProvider, PortfolioControllerStateContext }

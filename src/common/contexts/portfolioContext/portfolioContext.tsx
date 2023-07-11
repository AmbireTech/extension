import usePortfolio, { UsePortfolioReturnType } from 'ambire-common/src/hooks/usePortfolio'
import React, { createContext, useEffect, useMemo, useRef, useState } from 'react'
import { AppState } from 'react-native'

import CONFIG from '@common/config/env'
import useAccounts from '@common/hooks/useAccounts'
import useConstants from '@common/hooks/useConstants'
import useNetwork from '@common/hooks/useNetwork'
import useStorage from '@common/hooks/useStorage'
import useToasts from '@common/hooks/useToast'
import { fetchGet } from '@common/services/fetch'

import { normalizeResponse } from './normalize'

interface PortfolioContextReturnType extends UsePortfolioReturnType {}

const PortfolioContext = createContext<PortfolioContextReturnType>({
  balance: {
    total: {
      full: 0,
      truncated: '0',
      decimals: '00'
    },
    network: ''
  },
  allBalances: [],
  tokens: [],
  protocols: [] as any,
  extraTokens: [],
  hiddenTokens: [],
  collectibles: [],
  requestOtherProtocolsRefresh: () => Promise.resolve(null),
  onAddExtraToken: () => {},
  onRemoveExtraToken: () => {},
  onAddHiddenToken: () => {},
  onRemoveHiddenToken: () => {},
  balancesByNetworksLoading: {},
  isCurrNetworkBalanceLoading: false,
  areAllNetworksBalancesLoading: () => false,
  otherProtocolsByNetworksLoading: {},
  isCurrNetworkProtocolsLoading: false,
  loadBalance: () => {},
  loadProtocols: () => {}
})

const VELCRO_API_ENDPOINT_V2 = 'https://velcro.ambire.com/v2'
// velcro.ambire.com/v2/
// balance/0xC2E6dFcc2C6722866aD65F211D5757e1D2879337/ethereum?newBalances=true&available_on_coingecko=true

const getBalances = async (
  network: any,
  protocol: any,
  address: any,
  provider?: any,
  quickResponse = false
) => {
  const urlv2 = `${
    provider === 'velcro' ? VELCRO_API_ENDPOINT_V2 : CONFIG.ZAPPER_API_ENDPOINT
  }/balance/${address}/${network}${quickResponse ? '?quick=true' : ''}`
  const urlv1 = `${
    provider === 'velcro' ? CONFIG.VELCRO_API_ENDPOINT : CONFIG.ZAPPER_API_ENDPOINT
  }/protocols/${protocol}/balances?addresses[]=${address}&network=${network}&api_key=${
    CONFIG.ZAPPER_API_KEY
  }&newBalances=true`

  const r = await fetchGet(urlv2)
  return normalizeResponse(r, protocol)

  // const r = await fetchGet(urlv1)
  // console.log('r', r)
  // return r
}

const PortfolioProvider: React.FC = ({ children }) => {
  const appState = useRef(AppState.currentState)

  const [appStateVisible, setAppStateVisible] = useState<any>(appState.current)

  const { network } = useNetwork()
  const { selectedAcc } = useAccounts()

  // Refresh balance when app is focused
  useEffect(() => {
    const handleAppStateChange = (nextAppState: any) => {
      appState.current = nextAppState
      setAppStateVisible(appState.current)
    }

    const stateChange = AppState.addEventListener('change', handleAppStateChange)
    return () => stateChange.remove()
  }, [])

  const {
    balance,
    allBalances,
    tokens,
    extraTokens,
    hiddenTokens,
    protocols,
    collectibles,
    requestOtherProtocolsRefresh,
    onAddExtraToken,
    onRemoveExtraToken,
    onAddHiddenToken,
    onRemoveHiddenToken,
    balancesByNetworksLoading,
    isCurrNetworkBalanceLoading,
    areAllNetworksBalancesLoading,
    otherProtocolsByNetworksLoading,
    isCurrNetworkProtocolsLoading,
    loadBalance,
    loadProtocols,
    checkIsTokenEligibleForAddingAsExtraToken
  } = usePortfolio({
    useConstants,
    currentNetwork: network?.id as string,
    account: selectedAcc,
    useStorage,
    isVisible: appStateVisible === 'active',
    useToasts,
    getBalances
  })

  return (
    <PortfolioContext.Provider
      value={useMemo(
        () => ({
          balance,
          allBalances,
          tokens,
          extraTokens,
          hiddenTokens,
          protocols,
          collectibles,
          requestOtherProtocolsRefresh,
          onAddExtraToken,
          onRemoveExtraToken,
          checkIsTokenEligibleForAddingAsExtraToken,
          onAddHiddenToken,
          onRemoveHiddenToken,
          balancesByNetworksLoading,
          isCurrNetworkBalanceLoading,
          areAllNetworksBalancesLoading,
          otherProtocolsByNetworksLoading,
          isCurrNetworkProtocolsLoading,
          loadBalance,
          loadProtocols
        }),
        [
          balance,
          allBalances,
          tokens,
          extraTokens,
          hiddenTokens,
          protocols,
          collectibles,
          requestOtherProtocolsRefresh,
          onAddExtraToken,
          onRemoveExtraToken,
          checkIsTokenEligibleForAddingAsExtraToken,
          onAddHiddenToken,
          onRemoveHiddenToken,
          balancesByNetworksLoading,
          isCurrNetworkBalanceLoading,
          areAllNetworksBalancesLoading,
          otherProtocolsByNetworksLoading,
          isCurrNetworkProtocolsLoading,
          loadBalance,
          loadProtocols
        ]
      )}
    >
      {children}
    </PortfolioContext.Provider>
  )
}

export { PortfolioContext, PortfolioProvider }

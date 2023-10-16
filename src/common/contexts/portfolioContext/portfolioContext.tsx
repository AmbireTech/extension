import { Account } from 'ambire-common/src/hooks/useAccounts'
import usePortfolio, { Network, UsePortfolioReturnType } from 'ambire-common/src/hooks/usePortfolio'
import React, { createContext, useEffect, useMemo, useRef, useState } from 'react'
import { AppState } from 'react-native'

import CONFIG from '@common/config/env'
import useAccounts from '@common/hooks/useAccounts'
import useCacheStorage from '@common/hooks/useCacheStorage'
import useConstants from '@common/hooks/useConstants'
import useNetwork from '@common/hooks/useNetwork'
import useRelayerData from '@common/hooks/useRelayerData'
import useRequests from '@common/hooks/useRequests'
import useStorage from '@common/hooks/useStorage'
import useToasts from '@common/hooks/useToast'
import { fetchGet } from '@common/services/fetch'

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
  extraTokens: [],
  hiddenTokens: [],
  collectibles: [],
  onAddExtraToken: () => {},
  onRemoveExtraToken: () => {},
  onAddHiddenToken: () => {},
  onRemoveHiddenToken: () => {},
  balancesByNetworksLoading: {},
  isCurrNetworkBalanceLoading: false,
  areAllNetworksBalancesLoading: () => false,
  loadBalance: () => {},
  onAddHiddenCollectible: () => {},
  onRemoveHiddenCollectible: () => {},
  hiddenCollectibles: []
})

const getBalances = (
  network: Network,
  address: Account['id'],
  provider: 'velcro' | 'zapper' | '',
  quickResponse = false
) => {
  if (provider === '' || !provider) return null
  return fetchGet(
    `${
      provider === 'velcro' ? CONFIG.VELCRO_API_ENDPOINT : CONFIG.ZAPPER_API_ENDPOINT
    }/balance/${address}/${network}${quickResponse ? '?quick=true' : ''}`
  )
}

const getCoingeckoPrices = (addresses: any) =>
  fetchGet(`${CONFIG.COINGECKO_API_URL}/simple/price?ids=${addresses}&vs_currencies=usd`)

const getCoingeckoCoin = (id: string) => fetchGet(`${CONFIG.COINGECKO_API_URL}/coins/${id}`)

const getCoingeckoPriceByContract = (id: any, addresses: any) =>
  fetchGet(`${CONFIG.COINGECKO_API_URL}/coins/${id}/contract/${addresses}`)

const PortfolioProvider: React.FC = ({ children }) => {
  const appState = useRef(AppState.currentState)

  const [appStateVisible, setAppStateVisible] = useState<any>(appState.current)

  const { network } = useNetwork()
  const { selectedAcc, account: selectedAccount, accounts } = useAccounts()
  const { requests, eligibleRequests, sentTxn, requestPendingState } = useRequests()

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
    otherBalances,
    tokens,
    extraTokens,
    hiddenTokens,
    collectibles,
    onAddExtraToken,
    onRemoveExtraToken,
    onAddHiddenToken,
    onRemoveHiddenToken,
    balancesByNetworksLoading,
    isCurrNetworkBalanceLoading,
    resultTime,
    onAddHiddenCollectible,
    onRemoveHiddenCollectible,
    hiddenCollectibles,
    loadBalance,
    checkIsTokenEligibleForAddingAsExtraToken
  } = usePortfolio({
    useConstants,
    currentNetwork: network?.id as Network,
    account: selectedAcc,
    useStorage,
    isVisible: appStateVisible === 'active',
    useToasts,
    getBalances,
    getCoingeckoPrices,
    getCoingeckoPriceByContract,
    getCoingeckoCoin,
    relayerURL: CONFIG.RELAYER_URL,
    useRelayerData,
    eligibleRequests,
    requests,
    selectedAccount,
    sentTxn,
    useCacheStorage,
    accounts,
    requestPendingState
  })

  return (
    <PortfolioContext.Provider
      value={useMemo(
        () => ({
          balance,
          otherBalances,
          tokens,
          extraTokens,
          hiddenTokens,
          collectibles,
          onAddExtraToken,
          onRemoveExtraToken,
          checkIsTokenEligibleForAddingAsExtraToken,
          onAddHiddenToken,
          onRemoveHiddenToken,
          balancesByNetworksLoading,
          isCurrNetworkBalanceLoading,
          resultTime,
          loadBalance,
          onAddHiddenCollectible,
          onRemoveHiddenCollectible,
          hiddenCollectibles
        }),
        [
          balance,
          otherBalances,
          tokens,
          extraTokens,
          hiddenTokens,
          collectibles,
          onAddExtraToken,
          onRemoveExtraToken,
          checkIsTokenEligibleForAddingAsExtraToken,
          onAddHiddenToken,
          onRemoveHiddenToken,
          balancesByNetworksLoading,
          isCurrNetworkBalanceLoading,
          resultTime,
          loadBalance,
          onAddHiddenCollectible,
          onRemoveHiddenCollectible,
          hiddenCollectibles
        ]
      )}
    >
      {children}
    </PortfolioContext.Provider>
  )
}

export { PortfolioContext, PortfolioProvider }

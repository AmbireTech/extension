import usePortfolio, { UsePortfolioReturnType } from 'ambire-common/src/hooks/usePortfolio'
import React, { createContext, useEffect, useMemo, useRef, useState } from 'react'
import { AppState } from 'react-native'

import CONFIG from '@common/config/env'
import useAccounts from '@common/hooks/useAccounts'
import useConstants from '@common/hooks/useConstants'
import useNetwork from '@common/hooks/useNetwork'
import useStorage from '@common/hooks/useStorage'
import useToasts from '@common/hooks/useToast'
import useRelayerData from '@common/hooks/useRelayerData'
import useRequests from '@common/hooks/useRequests'
import { fetchGet } from '@common/services/fetch'
import useCacheStorage from '@common/hooks/useCacheStorage'

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
  otherBalances: [],
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
  loadBalance: () => {}
})

const getBalances = (network: any, protocol: any, address: any, provider?: any) =>
  fetchGet(
    `${
      provider === 'velcro' ? CONFIG.VELCRO_API_ENDPOINT : CONFIG.ZAPPER_API_ENDPOINT
    }/protocols/${protocol}/balances?addresses[]=${address}&network=${network}&api_key=${
      CONFIG.ZAPPER_API_KEY
    }&newBalances=true`
  )

// const getBalances = (network: any, address: any, provider: any, quickResponse?: boolean) => {
//   if (provider === '' || !provider) return null
//   return fetchGet(
//     `${
//       provider === 'velcro' ? CONFIG.VELCRO_API_ENDPOINT : CONFIG.ZAPPER_API_ENDPOINT
//     }/balance/${address}/${network}${quickResponse ? '?quick=true' : ''}`
//   )
// }

const getCoingeckoPrices = (addresses: any) =>
  fetchGet(`${CONFIG.COINGECKO_API_URL}/simple/price?ids=${addresses}&vs_currencies=usd`)

const getCoingeckoAssetPlatforms = () => fetchGet(`${CONFIG.COINGECKO_API_URL}/asset_platforms`)

const getCoingeckoPriceByContract = (id: any, addresses: any) =>
  fetchGet(`${CONFIG.COINGECKO_API_URL}/coins/${id}/contract/${addresses}`)

const PortfolioProvider: React.FC = ({ children }) => {
  const appState = useRef(AppState.currentState)

  const [appStateVisible, setAppStateVisible] = useState<any>(appState.current)

  const { network } = useNetwork()
  const { selectedAcc, account: selectedAccount, accounts } = useAccounts()
  const { requests, eligibleRequests, sentTxn } = useRequests()

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
    areAllNetworksBalancesLoading,
    loadBalance,
    checkIsTokenEligibleForAddingAsExtraToken
  } = usePortfolio({
    useConstants,
    currentNetwork: network?.id as string,
    account: selectedAcc,
    useStorage,
    isVisible: appStateVisible === 'active',
    useToasts,
    getBalances,
    getCoingeckoPrices,
    getCoingeckoPriceByContract,
    getCoingeckoAssetPlatforms,
    relayerURL: CONFIG.RELAYER_URL,
    useRelayerData,
    eligibleRequests,
    requests,
    selectedAccount,
    sentTxn,
    useCacheStorage,
    accounts
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
          areAllNetworksBalancesLoading,
          loadBalance
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
          areAllNetworksBalancesLoading,
          loadBalance
        ]
      )}
    >
      {children}
    </PortfolioContext.Provider>
  )
}

export { PortfolioContext, PortfolioProvider }

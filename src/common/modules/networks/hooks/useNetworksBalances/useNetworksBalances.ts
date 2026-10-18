import { useMemo } from 'react'

import { getPrivacyPoolsValuePerChain } from '@ambire-common/libs/privacyPools/prices'
import { getPrivateAccountSeedId } from '@ambire-common/libs/privateAccount/privateAccount'
import useController from '@common/hooks/useController'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectPrivacyPoolsAccountId = (
  state: AllControllersMappingType['SelectedAccountController']
) => getPrivateAccountSeedId(state.privateAccount, 'privacyPools')
const selectPortfolio = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.portfolio
const selectIsAccountSelected = (state: AllControllersMappingType['SelectedAccountController']) =>
  !!state.account
const selectPrivacyPoolsBalances = (state: AllControllersMappingType['PrivacyPoolsController']) =>
  state.balances
const selectPrivacyPoolsPrices = (state: AllControllersMappingType['PrivacyPoolsController']) =>
  state.prices
const selectPrivacyPoolsChainIds = (state: AllControllersMappingType['PrivacyPoolsController']) =>
  state.supportedChainIds

const NO_VALUES: { [chainId: string]: number } = {}

/**
 * The networks screen's networks and balances: the portfolio's for a regular account, or the
 * Privacy Pools networks for a Privacy Pools account (valued like its dashboard).
 */
const useNetworksBalances = () => {
  const { state: privacyPoolsAccountId } = useController(
    'SelectedAccountController',
    selectPrivacyPoolsAccountId
  )
  const { state: portfolio } = useController('SelectedAccountController', selectPortfolio)
  const { state: isAccountSelected } = useController(
    'SelectedAccountController',
    selectIsAccountSelected
  )
  const { state: privacyPoolsBalances } = useController(
    'PrivacyPoolsController',
    selectPrivacyPoolsBalances
  )
  const { state: privacyPoolsPrices } = useController(
    'PrivacyPoolsController',
    selectPrivacyPoolsPrices
  )
  const { state: privacyPoolsChainIds } = useController(
    'PrivacyPoolsController',
    selectPrivacyPoolsChainIds
  )

  const privacyPoolsBalancePerNetwork = useMemo(
    () =>
      privacyPoolsAccountId
        ? getPrivacyPoolsValuePerChain(privacyPoolsBalances || {}, privacyPoolsPrices || {})
        : NO_VALUES,
    [privacyPoolsAccountId, privacyPoolsBalances, privacyPoolsPrices]
  )

  return useMemo(() => {
    if (!privacyPoolsAccountId)
      return {
        isPrivacyPoolsAccount: false,
        isAccountSelected,
        chainIds: Object.keys(portfolio.balancePerNetwork || {}),
        balancePerNetwork: portfolio.balancePerNetwork || {},
        totalBalance: portfolio.totalBalance || 0
      }

    const balancePerNetwork: { [chainId: string]: number } = Object.fromEntries(
      (privacyPoolsChainIds || []).map((chainId) => [
        chainId,
        privacyPoolsBalancePerNetwork[chainId] || 0
      ])
    )

    return {
      isPrivacyPoolsAccount: true,
      isAccountSelected: true,
      chainIds: Object.keys(balancePerNetwork),
      balancePerNetwork,
      totalBalance: Object.values(balancePerNetwork).reduce((total, value) => total + value, 0)
    }
  }, [
    isAccountSelected,
    portfolio.balancePerNetwork,
    portfolio.totalBalance,
    privacyPoolsAccountId,
    privacyPoolsBalancePerNetwork,
    privacyPoolsChainIds
  ])
}

export default useNetworksBalances

import React, { FC, useCallback, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { PrivacyPoolsUnavailableReason } from '@ambire-common/interfaces/privacyPools'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useDebounce from '@common/hooks/useDebounce'
import DashboardPageScrollContainer from '@common/modules/dashboard/components/DashboardPageScrollContainer'
import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'
import TokensEmptyState from '@common/modules/dashboard/components/Tokens/TokensEmptyState'
import { searchWithNetworkName } from '@common/utils/search'
import PrivacyPoolsBalances from '@web/modules/privacy-pools/components/PrivacyPoolsBalances'
import {
  PrivacyPoolsBalanceDisplay,
  PrivacyPoolsBalancesState
} from '@web/modules/privacy-pools/hooks/usePrivacyPools/usePrivacyPools'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

/** A Privacy Pools account has no NFTs or DeFi positions. In the order its pages are rendered in. */
export const PRIVACY_POOLS_TABS: TabType[] = ['tokens', 'activity']

// Same as the regular token list
const SEARCH_DEBOUNCE_MS = 200
const SEARCH_KEYS = ['symbol', 'tokenAddress']
const NO_NETWORKS: never[] = []
const DATA = ['balances']

const selectDashboardNetworkFilter = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.dashboardNetworkFilter

interface Props {
  openTab: TabType
  balances: PrivacyPoolsBalanceDisplay[]
  state: PrivacyPoolsBalancesState
  unavailableReason: PrivacyPoolsUnavailableReason | null
  /** Whether reading waits for the recovery phrase backup. */
  isWaitingForBackup: boolean
  /** The dashboard's network filter name, if any. */
  networkFilterName: string | null
}

/** The Tokens page of a Privacy Pools account, a slide of the dashboard carousel. */
const PrivacyPoolsTokensPage: FC<Props> = ({
  openTab,
  balances,
  state,
  unavailableReason,
  isWaitingForBackup,
  networkFilterName
}) => {
  const { t } = useTranslation()
  const { state: dashboardNetworkFilter } = useController(
    'SelectedAccountController',
    selectDashboardNetworkFilter
  )
  const { control } = useForm({ mode: 'all', defaultValues: { search: '' } })
  const inputSearchValue = useWatch({ control, name: 'search' })
  const searchValue = useDebounce({ value: inputSearchValue, delay: SEARCH_DEBOUNCE_MS })

  // By symbol and address like the regular token list; the network picker filters by network
  const filteredBalances = useMemo(
    () =>
      searchWithNetworkName({
        networks: NO_NETWORKS,
        items: balances.filter(
          ({ chainId }) => !dashboardNetworkFilter || chainId === String(dashboardNetworkFilter)
        ),
        search: searchValue,
        keys: SEARCH_KEYS
      }),
    [balances, dashboardNetworkFilter, searchValue]
  )

  const isFiltered = !!searchValue || !!dashboardNetworkFilter

  const renderItem = useCallback(() => {
    // Has balances, but none match the filters
    if (state === 'ready' && isFiltered && !filteredBalances.length && balances.length)
      return (
        <TokensEmptyState
          searchValue={searchValue}
          dashboardNetworkFilterName={networkFilterName}
        />
      )

    return (
      <PrivacyPoolsBalances
        balances={filteredBalances}
        state={state}
        unavailableReason={unavailableReason}
        isWaitingForBackup={isWaitingForBackup}
      />
    )
  }, [
    balances.length,
    filteredBalances,
    isFiltered,
    networkFilterName,
    searchValue,
    state,
    unavailableReason,
    isWaitingForBackup
  ])

  const keyExtractor = useCallback((item: string) => item, [])

  // Rendered by the carousel above the pages, like the regular dashboard's
  const floatingBar = useMemo(
    () => ({ control, networkFilterTab: 'tokens' as const, searchPlaceholder: t('Search token') }),
    [control, t]
  )

  return (
    <DashboardPageScrollContainer
      floatingBar={floatingBar}
      tab="tokens"
      openTab={openTab}
      data={DATA}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      scrollEventThrottle={16}
    />
  )
}

export default React.memo(PrivacyPoolsTokensPage)

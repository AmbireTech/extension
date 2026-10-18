import React, { FC, ReactElement, useCallback, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Animated, View } from 'react-native'

import { PrivacyPoolsUnavailableReason } from '@ambire-common/interfaces/privacyPools'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useDebounce from '@common/hooks/useDebounce'
import useTheme from '@common/hooks/useTheme'
import DashboardPageScrollContainer from '@common/modules/dashboard/components/DashboardPageScrollContainer'
import FloatingBottomBar from '@common/modules/dashboard/components/FloatingBottomBar'
import TabsAndSearch from '@common/modules/dashboard/components/TabsAndSearch'
import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'
import TokensEmptyState from '@common/modules/dashboard/components/Tokens/TokensEmptyState'
import { searchWithNetworkName } from '@common/utils/search'
import PrivacyPoolsBalances from '@web/modules/privacy-pools/components/PrivacyPoolsBalances'
import {
  PrivacyPoolsBalanceDisplay,
  PrivacyPoolsBalancesState
} from '@web/modules/privacy-pools/hooks/usePrivacyPools/usePrivacyPools'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

/** A Privacy Pools account has no NFTs or DeFi positions. */
export const PRIVACY_POOLS_TABS: TabType[] = ['tokens', 'activity']

// Same as the regular token list
const SEARCH_DEBOUNCE_MS = 200
const SEARCH_KEYS = ['symbol', 'tokenAddress']
const NO_NETWORKS: never[] = []

const selectDashboardNetworkFilter = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.dashboardNetworkFilter

interface Props {
  openTab: TabType
  setOpenTab: React.Dispatch<React.SetStateAction<TabType>>
  sessionId: string
  animatedOverviewHeight: Animated.Value
  /** Shown above the tabs, like the regular dashboard's banners. */
  banners: ReactElement
  balances: PrivacyPoolsBalanceDisplay[]
  state: PrivacyPoolsBalancesState
  unavailableReason: PrivacyPoolsUnavailableReason | null
  /** Whether reading waits for the recovery phrase backup. */
  isWaitingForBackup: boolean
  /** The dashboard's network filter name, if any. */
  networkFilterName: string | null
  /** See `PrivacyPoolsBalances`. */
  unavailableText?: string
}

/** The Tokens page of a Privacy Pools account, laid out like the regular dashboard's. */
const PrivacyPoolsTokensPage: FC<Props> = ({
  openTab,
  setOpenTab,
  sessionId,
  animatedOverviewHeight,
  banners,
  balances,
  state,
  unavailableReason,
  isWaitingForBackup,
  networkFilterName,
  unavailableText
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
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

  const renderItem = useCallback(
    ({ item }: { item: string }) => {
      if (item === 'header')
        return (
          <View style={{ backgroundColor: theme.primaryBackground }}>
            <TabsAndSearch
              openTab={openTab}
              setOpenTab={setOpenTab}
              sessionId={sessionId}
              tabs={PRIVACY_POOLS_TABS}
            />
          </View>
        )

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
          unavailableText={unavailableText}
        />
      )
    },
    [
      balances.length,
      filteredBalances,
      isFiltered,
      networkFilterName,
      openTab,
      searchValue,
      sessionId,
      setOpenTab,
      state,
      theme.primaryBackground,
      unavailableReason,
      isWaitingForBackup,
      unavailableText
    ]
  )

  const keyExtractor = useCallback((item: string) => item, [])

  const floatingBar = useMemo(
    () => ({ control, networkFilterTab: 'tokens' as const, searchPlaceholder: t('Search token') }),
    [control, t]
  )

  return (
    <>
      <DashboardPageScrollContainer
        floatingBar={floatingBar}
        tab="tokens"
        openTab={openTab}
        ListHeaderComponent={banners}
        animatedOverviewHeight={animatedOverviewHeight}
        data={['header', 'balances']}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        scrollEventThrottle={16}
      />
      {openTab === 'tokens' && <FloatingBottomBar {...floatingBar} isHidden={false} />}
    </>
  )
}

export default React.memo(PrivacyPoolsTokensPage)

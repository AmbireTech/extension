import React, { FC, useCallback, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { BannerType } from '@ambire-common/interfaces/banner'
import {
  defiPositionsOnDisabledNetworksBannerId,
  getCurrentAccountBanners
} from '@ambire-common/libs/banners/banners'
import Banner from '@common/components/Banner'
import HourglassIconAnimated from '@common/components/HourglassIconAnimated'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useControllerSession from '@common/hooks/useControllerSession'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import DashboardBanner from '@common/modules/dashboard/components/DashboardBanners/DashboardBanner'
import DashboardPageScrollContainer from '@common/modules/dashboard/components/DashboardPageScrollContainer'
import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'
import spacings from '@common/styles/spacings'
import { openInTab } from '@common/utils/links'
import { searchWithNetworkName } from '@common/utils/search'
import { getUiType } from '@common/utils/uiType'

import AutoDiscoveryOffAlert from './AutoDiscoveryOffAlert'
import DefiPositionsSkeleton from './DefiPositionsSkeleton'
import DeFiPosition from './DeFiProviderPosition'
import { getHasPendingDefiUpdate } from './helpers'
import styles from './styles'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

interface Props {
  openTab: TabType
  initTab?: { [key: string]: boolean }
  sessionId: string
  dashboardNetworkFilterName: string | null
}

const { isPopup } = getUiType()

const selectScheduledUpdateChainIds = (state: AllControllersMappingType['PortfolioController']) =>
  state.scheduledUpdateChainIds

const selectPortfolioDefiPositions = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.portfolio?.defiPositions
const selectPortfolioIsAllReady = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.portfolio?.isAllReady

const selectIsAutoDiscoveryEnabled = (state: AllControllersMappingType['FeatureFlagsController']) =>
  !!state.flags?.tokenAndDefiAutoDiscovery

const selectNetworks = (state: AllControllersMappingType['NetworksController']) => state.networks
const selectAccount = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account
const selectDashboardNetworkFilter = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.dashboardNetworkFilter
const selectBanners = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.banners

const DeFiPositions: FC<Props> = ({ openTab, initTab, sessionId, dashboardNetworkFilterName }) => {
  const { t } = useTranslation()
  const { state: isAutoDiscoveryEnabled } = useController(
    'FeatureFlagsController',
    selectIsAutoDiscoveryEnabled
  )
  const { control, watch, setValue } = useForm({ mode: 'all', defaultValues: { search: '' } })
  const { theme } = useTheme()
  const searchValue = watch('search')
  const { state: networks } = useController('NetworksController', selectNetworks)
  const { state: scheduledUpdateChainIds, dispatch: portfolioDispatch } = useController(
    'PortfolioController',
    selectScheduledUpdateChainIds
  )
  const { state: account } = useController('SelectedAccountController', selectAccount)
  const { state: defiPositions } = useController(
    'SelectedAccountController',
    selectPortfolioDefiPositions
  )
  const { state: isPortfolioAllReady } = useController(
    'SelectedAccountController',
    selectPortfolioIsAllReady
  )
  const { state: dashboardNetworkFilter } = useController(
    'SelectedAccountController',
    selectDashboardNetworkFilter
  )
  const { state: banners } = useController('SelectedAccountController', selectBanners)
  const { setSearchParams } = useNavigation()

  const hasPendingUpdate = useMemo(
    () =>
      getHasPendingDefiUpdate({
        scheduledUpdateChainIds,
        accountAddr: account?.addr,
        dashboardNetworkFilter
      }),
    [scheduledUpdateChainIds, account?.addr, dashboardNetworkFilter]
  )

  const currentAccountBanners = useMemo(
    () =>
      getCurrentAccountBanners(banners, account?.addr).filter(
        ({ id }) => id === defiPositionsOnDisabledNetworksBannerId
      ),
    [banners, account]
  )

  useEffect(() => {
    setValue('search', '')
  }, [openTab, setValue])

  // The session is what keeps the portfolio fetching defi positions, so it lasts for
  // as long as the tab is open and this is the screen the user is on.
  useControllerSession({
    isEnabled: !!initTab?.defi,
    open: () => {
      portfolioDispatch({
        type: 'method',
        params: {
          method: 'addDefiSession',
          args: [sessionId]
        }
      })
      // Initialize the port session, so the background can terminate it when the tab
      // is closed - there is no reliable window event for that.
      setSearchParams((prev: any) => {
        prev.set('sessionId', sessionId)
        return prev
      })
    },
    close: () =>
      portfolioDispatch({
        type: 'method',
        params: {
          method: 'removeDefiSession',
          args: [sessionId]
        }
      })
  })

  const filteredPositions = useMemo(() => {
    const defiToSearch = defiPositions
      .filter(({ chainId, positions }) => {
        let isMatchingNetwork = true

        if (dashboardNetworkFilter) {
          isMatchingNetwork = chainId === BigInt(dashboardNetworkFilter)
        }

        return isMatchingNetwork && positions.length
      })
      .map((position) => ({
        ...position,
        assetNames: position.positions
          .map(({ assets }) => assets.map(({ symbol }) => symbol).join(' '))
          .join(' ')
      }))

    return searchWithNetworkName({
      networks,
      items: defiToSearch,
      search: searchValue,
      keys: ['providerName', 'assetNames']
    })
  }, [defiPositions, dashboardNetworkFilter, searchValue, networks])

  const renderItem = useCallback(
    ({ item }: any) => {
      if (item === 'banners') {
        return (
          <View style={spacings.mbMi}>
            {currentAccountBanners.map((banner) => (
              <DashboardBanner
                key={banner.id}
                banner={{ ...banner, type: banner.type as BannerType }}
              />
            ))}
          </View>
        )
      }

      if (item === 'pending-update') {
        return (
          <Banner
            type="info"
            CustomIcon={HourglassIconAnimated}
            title={t('Updating after your recent transaction.')}
            text={t('This may take a minute...')}
          />
        )
      }

      if (item === 'empty') {
        return (
          <>
            <Text
              testID="no-protocols-text"
              fontSize={16}
              weight="medium"
              style={styles.noPositions}
            >
              {!searchValue && !dashboardNetworkFilterName && t('No known protocols detected.')}
              {!searchValue &&
                dashboardNetworkFilterName &&
                t(`No known protocols detected on ${dashboardNetworkFilterName}.`)}
              {searchValue &&
                t(
                  `No known protocols match "${searchValue}"${
                    dashboardNetworkFilterName ? ` on ${dashboardNetworkFilterName}` : ''
                  }.`
                )}
            </Text>
            {/* With auto discovery off, the alert below explains the missing protocols instead */}
            {isAutoDiscoveryEnabled && (
              <Text testID="suggest-protocol-text" fontSize={14} style={styles.noPositions}>
                {t('To suggest a protocol integration, ')}
                <Text
                  testID="open-ticket-link"
                  fontSize={14}
                  appearance="primary"
                  color={theme.linkText}
                  onPress={() => {
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises
                    openInTab({ url: 'https://help.ambire.com/en' })
                  }}
                >
                  {t('open a ticket.')}
                </Text>
              </Text>
            )}
          </>
        )
      }

      if (item === 'auto-discovery-off') {
        return <AutoDiscoveryOffAlert />
      }

      if (item === 'skeleton') {
        return <DefiPositionsSkeleton amount={4} />
      }

      if (!initTab?.defi || !item || item === 'keep-this-to-avoid-key-warning') return null

      return <DeFiPosition key={item.providerName + item.network} {...item} />
    },
    [
      initTab?.defi,
      theme.linkText,
      currentAccountBanners,
      searchValue,
      dashboardNetworkFilterName,
      isAutoDiscoveryEnabled,
      t
    ]
  )

  const keyExtractor = useCallback((positionOrElement: any) => {
    if (typeof positionOrElement === 'string') return positionOrElement

    return `${positionOrElement.providerName}-${positionOrElement.chainId}`
  }, [])

  const dataItems = useMemo(() => {
    const items: string[] = []

    if (currentAccountBanners.length > 0) {
      items.push('banners')
    }
    // Only worth saying when the API positions refresh; with discovery off they never do
    if (isAutoDiscoveryEnabled && hasPendingUpdate) {
      items.push('pending-update')
    }
    items.push(!isPortfolioAllReady ? 'skeleton' : 'keep-this-to-avoid-key-warning')
    // With auto discovery off, these are only the positions the wallet reads on its own (RPC)
    if (initTab?.defi && isPortfolioAllReady) {
      filteredPositions.forEach((p: any) => items.push(p))
    }
    items.push(isPortfolioAllReady && !filteredPositions.length ? 'empty' : '')
    if (!isAutoDiscoveryEnabled && isPortfolioAllReady) {
      items.push('auto-discovery-off')
    }

    return items
  }, [
    currentAccountBanners.length,
    filteredPositions,
    isAutoDiscoveryEnabled,
    hasPendingUpdate,
    initTab?.defi,
    isPortfolioAllReady
  ])

  // Rendered by the carousel above the pages, so it stays put through a swipe
  const floatingBar = useMemo(
    () => ({ control, networkFilterTab: 'defi' as const, searchPlaceholder: t('Search DeFi') }),
    [control, t]
  )

  return (
    <DashboardPageScrollContainer
      floatingBar={floatingBar}
      tab="defi"
      openTab={openTab}
      data={dataItems}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onEndReachedThreshold={isPopup ? 5 : 2.5}
      initialNumToRender={isPopup ? 10 : 20}
      windowSize={9} // Larger values can cause performance issues.
      scrollEventThrottle={16}
    />
  )
}

export default React.memo(DeFiPositions)

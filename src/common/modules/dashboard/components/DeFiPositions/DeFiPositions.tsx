import React, { FC, useCallback, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Animated, FlatListProps, TouchableOpacity, View } from 'react-native'

import { BannerType } from '@ambire-common/interfaces/banner'
import {
  defiPositionsOnDisabledNetworksBannerId,
  getCurrentAccountBanners
} from '@ambire-common/libs/banners/banners'
import PrivacyIcon from '@common/assets/svg/PrivacyIcon'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import usePrevious from '@common/hooks/usePrevious'
import useTheme from '@common/hooks/useTheme'
import DashboardBanners from '@common/modules/dashboard/components/DashboardBanners'
import DashboardBanner from '@common/modules/dashboard/components/DashboardBanners/DashboardBanner'
import DashboardPageScrollContainer from '@common/modules/dashboard/components/DashboardPageScrollContainer'
import TabsAndSearch from '@common/modules/dashboard/components/TabsAndSearch'
import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'
import { searchWithNetworkName } from '@common/utils/search'
import { getUiType } from '@common/utils/uiType'

import SearchAndCurrentApp from '../SearchAndCurrentApp'
import DefiPositionsSkeleton from './DefiPositionsSkeleton'
import DeFiPosition from './DeFiProviderPosition'
import styles from './styles'

interface Props {
  openTab: TabType
  setOpenTab: React.Dispatch<React.SetStateAction<TabType>>
  initTab?: { [key: string]: boolean }
  sessionId: string
  onScroll: FlatListProps<any>['onScroll']
  dashboardNetworkFilterName: string | null
  animatedOverviewHeight: Animated.Value
  isSearchHidden: boolean
  refreshing?: boolean
  onRefresh?: () => void
}

const { isPopup } = getUiType()

const DeFiPositions: FC<Props> = ({
  openTab,
  setOpenTab,
  initTab,
  sessionId,
  onScroll,
  dashboardNetworkFilterName,
  animatedOverviewHeight,
  isSearchHidden,
  refreshing,
  onRefresh
}) => {
  const { t } = useTranslation()
  const { flags } = useController('FeatureFlagsController').state
  const { control, watch, setValue } = useForm({ mode: 'all', defaultValues: { search: '' } })
  const { theme, themeType } = useTheme()
  const searchValue = watch('search')
  const {
    state: { networks }
  } = useController('NetworksController')
  const { dispatch: portfolioDispatch } = useController('PortfolioController')
  const {
    state: { account, portfolio, dashboardNetworkFilter, banners }
  } = useController('SelectedAccountController')
  const { setSearchParams, navigate } = useNavigation()

  const prevInitTab: any = usePrevious(initTab)

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

  useEffect(() => {
    if (!prevInitTab?.defi && initTab?.defi) {
      portfolioDispatch({
        type: 'method',
        params: {
          method: 'addDefiSession',
          args: [sessionId]
        }
      })
      setSearchParams((prev: any) => {
        prev.set('sessionId', sessionId)
        return prev
      })
    }

    if (prevInitTab?.defi && !initTab?.defi) {
      portfolioDispatch({
        type: 'method',
        params: {
          method: 'removeDefiSession',
          args: [sessionId]
        }
      })
    }
  }, [portfolioDispatch, setSearchParams, prevInitTab?.defi, initTab?.defi, sessionId])

  useEffect(() => {
    return () => {
      portfolioDispatch({
        type: 'method',
        params: {
          method: 'removeDefiSession',
          args: [sessionId]
        }
      })
    }
  }, [sessionId, portfolioDispatch])

  const filteredPositions = useMemo(() => {
    const defiToSearch = portfolio.defiPositions
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
  }, [portfolio.defiPositions, dashboardNetworkFilter, searchValue, networks])

  const renderItem = useCallback(
    ({ item }: any) => {
      if (item === 'header') {
        return (
          <View style={{ backgroundColor: theme.primaryBackground }}>
            <TabsAndSearch
              openTab={openTab}
              setOpenTab={setOpenTab}
              currentTab="defi"
              sessionId={sessionId}
            />
          </View>
        )
      }

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
          </>
        )
      }

      if (item === 'disabled') {
        return (
          <View style={[flexbox.alignCenter, spacings.mt]}>
            <View style={[flexbox.directionRow, flexbox.alignSelfCenter]}>
              <Text fontSize={16} weight="medium" style={[spacings.mrTy]}>
                {t('Defi positions disabled')}
              </Text>
              <PrivacyIcon width={20} height={20} />
            </View>
            <TouchableOpacity onPress={() => navigate(ROUTES.optOuts)}>
              <Text
                onPress={() => navigate(ROUTES.optOuts)}
                fontSize={16}
                color={theme.infoText}
                style={{ textDecorationLine: 'underline' }}
              >
                {t('You can enable them from settings')}
              </Text>
            </TouchableOpacity>
          </View>
        )
      }

      if (item === 'skeleton') {
        return <DefiPositionsSkeleton amount={4} />
      }

      if (!initTab?.defi || !item || item === 'keep-this-to-avoid-key-warning') return null

      return <DeFiPosition key={item.providerName + item.network} {...item} />
    },
    [
      initTab?.defi,
      theme.primaryBackground,
      theme.linkText,
      theme.primary,
      theme.infoText,
      openTab,
      setOpenTab,
      sessionId,
      currentAccountBanners,
      searchValue,
      dashboardNetworkFilterName,
      t,
      themeType,
      navigate
    ]
  )

  const keyExtractor = useCallback((positionOrElement: any) => {
    if (typeof positionOrElement === 'string') return positionOrElement

    return `${positionOrElement.providerName}-${positionOrElement.chainId}`
  }, [])

  const dataItems = useMemo(() => {
    const items = ['header']

    if (currentAccountBanners.length > 0) {
      items.push('banners')
    }
    if (flags.tokenAndDefiAutoDiscovery) {
      items.push(!portfolio.isAllReady ? 'skeleton' : 'keep-this-to-avoid-key-warning')
      if (initTab?.defi && portfolio.isAllReady) {
        filteredPositions.forEach((p: any) => items.push(p))
      }
      items.push(portfolio.isAllReady && !filteredPositions.length ? 'empty' : '')
    } else {
      items.push('disabled')
    }

    return items
  }, [
    currentAccountBanners.length,
    filteredPositions,
    flags.tokenAndDefiAutoDiscovery,
    initTab?.defi,
    portfolio.isAllReady
  ])

  return (
    <>
      <DashboardPageScrollContainer
        tab="defi"
        openTab={openTab}
        ListHeaderComponent={<DashboardBanners />}
        data={dataItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReachedThreshold={isPopup ? 5 : 2.5}
        initialNumToRender={isPopup ? 10 : 20}
        windowSize={9} // Larger values can cause performance issues.
        onScroll={onScroll}
        scrollEventThrottle={16}
        animatedOverviewHeight={animatedOverviewHeight}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
      {openTab === 'defi' && <SearchAndCurrentApp control={control} isHidden={isSearchHidden} />}
    </>
  )
}

export default React.memo(DeFiPositions)

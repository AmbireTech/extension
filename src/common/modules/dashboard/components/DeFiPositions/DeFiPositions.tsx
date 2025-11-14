import React, { FC, useCallback, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Animated, FlatListProps, View } from 'react-native'

import { BannerType } from '@ambire-common/interfaces/banner'
import { getCurrentAccountBanners } from '@ambire-common/libs/banners/banners'
import Text from '@common/components/Text'
import useNavigation from '@common/hooks/useNavigation'
import usePrevious from '@common/hooks/usePrevious'
import useTheme from '@common/hooks/useTheme'
import DashboardBanners from '@common/modules/dashboard/components/DashboardBanners'
import DashboardPageScrollContainer from '@common/modules/dashboard/components/DashboardPageScrollContainer'
import TabsAndSearch from '@common/modules/dashboard/components/TabsAndSearch'
import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { getDoesNetworkMatch } from '@common/utils/search'
import { openInTab } from '@web/extension-services/background/webapi/tab'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import { getUiType } from '@web/utils/uiType'

import DashboardBanner from '../DashboardBanners/DashboardBanner'
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
}

const { isPopup } = getUiType()

const DeFiPositions: FC<Props> = ({
  openTab,
  setOpenTab,
  initTab,
  sessionId,
  onScroll,
  dashboardNetworkFilterName,
  animatedOverviewHeight
}) => {
  const { control, watch, setValue } = useForm({ mode: 'all', defaultValues: { search: '' } })
  const { t } = useTranslation()
  const { theme, themeType } = useTheme()
  const searchValue = watch('search')
  const { networks } = useNetworksControllerState()
  const { account, defiPositions, portfolio, dashboardNetworkFilter, banners } =
    useSelectedAccountControllerState()
  const { setSearchParams } = useNavigation()

  const { dispatch } = useBackgroundService()
  const prevInitTab: any = usePrevious(initTab)

  const currentAccountBanners = useMemo(
    () => getCurrentAccountBanners(banners, account?.addr),
    [banners, account?.addr]
  )

  useEffect(() => {
    setValue('search', '')
  }, [openTab, setValue])

  useEffect(() => {
    if (!prevInitTab?.defi && initTab?.defi) {
      dispatch({ type: 'DEFI_CONTOLLER_ADD_SESSION', params: { sessionId } })
      setSearchParams((prev) => {
        prev.set('sessionId', sessionId)
        return prev
      })
    }

    if (prevInitTab?.defi && !initTab?.defi) {
      dispatch({ type: 'DEFI_CONTOLLER_REMOVE_SESSION', params: { sessionId } })
    }
  }, [dispatch, setSearchParams, prevInitTab?.defi, initTab?.defi, sessionId])

  useEffect(() => {
    return () => {
      dispatch({ type: 'DEFI_CONTOLLER_REMOVE_SESSION', params: { sessionId } })
    }
  }, [sessionId, dispatch])

  const filteredPositions = useMemo(
    () =>
      defiPositions.filter(({ chainId, providerName }) => {
        let isMatchingNetwork = true
        let isMatchingSearch = true

        if (dashboardNetworkFilter) {
          isMatchingNetwork = chainId === BigInt(dashboardNetworkFilter)
        }

        if (searchValue) {
          const lowercaseSearch = searchValue.toLowerCase()
          isMatchingSearch =
            providerName.toLowerCase().includes(lowercaseSearch) ||
            getDoesNetworkMatch({
              networks,
              itemChainId: chainId,
              lowercaseSearch
            })
        }

        return isMatchingNetwork && isMatchingSearch
      }),
    [defiPositions, dashboardNetworkFilter, searchValue, networks]
  )

  const renderItem = useCallback(
    ({ item }: any) => {
      if (item === 'header') {
        return (
          <View style={{ backgroundColor: theme.primaryBackground }}>
            <TabsAndSearch
              openTab={openTab}
              setOpenTab={setOpenTab}
              currentTab="defi"
              searchControl={control}
              sessionId={sessionId}
            />
            {currentAccountBanners.length > 0 && (
              <View style={spacings.mbMi}>
                {currentAccountBanners.map((banner) => (
                  <DashboardBanner
                    key={banner.id}
                    banner={{ ...banner, type: banner.type as BannerType }}
                  />
                ))}
              </View>
            )}
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
                color={themeType === THEME_TYPES.DARK ? theme.linkText : theme.primary}
                onPress={() => {
                  // eslint-disable-next-line @typescript-eslint/no-floating-promises
                  openInTab({ url: 'https://help.ambire.com/hc/en-us' })
                }}
              >
                {t('open a ticket.')}
              </Text>
            </Text>
          </>
        )
      }

      if (item === 'skeleton') {
        return <DefiPositionsSkeleton amount={4} />
      }

      if (!initTab?.defi || !item || item === 'keep-this-to-avoid-key-warning') return null

      return <DeFiPosition key={item.providerName + item.network} {...item} />
    },
    [
      control,
      initTab?.defi,
      openTab,
      searchValue,
      setOpenTab,
      t,
      theme,
      sessionId,
      dashboardNetworkFilterName,
      themeType
    ]
  )

  const keyExtractor = useCallback((positionOrElement: any) => {
    if (typeof positionOrElement === 'string') return positionOrElement

    return `${positionOrElement.providerName}-${positionOrElement.chainId}`
  }, [])

  return (
    <DashboardPageScrollContainer
      tab="defi"
      openTab={openTab}
      ListHeaderComponent={<DashboardBanners />}
      data={[
        'header',
        !portfolio.isAllReady ? 'skeleton' : 'keep-this-to-avoid-key-warning',
        ...(initTab?.defi && portfolio.isAllReady ? filteredPositions : []),
        portfolio.isAllReady && !filteredPositions.length ? 'empty' : ''
      ]}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onEndReachedThreshold={isPopup ? 5 : 2.5}
      initialNumToRender={isPopup ? 10 : 20}
      windowSize={9} // Larger values can cause performance issues.
      onScroll={onScroll}
      animatedOverviewHeight={animatedOverviewHeight}
    />
  )
}

export default React.memo(DeFiPositions)

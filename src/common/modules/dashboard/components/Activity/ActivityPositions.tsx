import React, { FC, useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated, FlatListProps, TouchableOpacity, View } from 'react-native'

import { BannerType } from '@ambire-common/interfaces/banner'
import { Network } from '@ambire-common/interfaces/network'
import { getCurrentAccountBanners } from '@ambire-common/libs/banners/banners'
import InfoIcon from '@common/assets/svg/InfoIcon'
import Banner from '@common/components/Banner'
import Button from '@common/components/Button'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import usePrevious from '@common/hooks/usePrevious'
import useTheme from '@common/hooks/useTheme'
import ActivityPositionsSkeleton from '@common/modules/dashboard/components/Activity/ActivityPositionsSkeleton'
import DashboardBanners from '@common/modules/dashboard/components/DashboardBanners'
import DashboardPageScrollContainer from '@common/modules/dashboard/components/DashboardPageScrollContainer'
import TabsAndSearch from '@common/modules/dashboard/components/TabsAndSearch'
import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@web/extension-services/background/webapi/tab'
import useActivityControllerState from '@web/hooks/useActivityControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import SubmittedTransactionSummary from '@web/modules/settings/components/TransactionHistory/SubmittedTransactionSummary'
import { getUiType } from '@web/utils/uiType'

import styles from './styles'

interface Props {
  openTab: TabType
  setOpenTab: React.Dispatch<React.SetStateAction<TabType>>
  initTab?: { [key: string]: boolean }
  sessionId: string
  onScroll: FlatListProps<any>['onScroll']
  animatedOverviewHeight: Animated.Value
  network: Network | null
}

const { isPopup, isRequestWindow } = getUiType()

const ITEMS_PER_PAGE = 10

const blockExplorerUrl = (explorerUrl: string | null, address: string) => {
  return `${explorerUrl}/address/${address}`
}

const blockExplorerName = (explorerUrl: string) => {
  return explorerUrl.replace('https://', '').replace('http://', '').replace('www.', '')
}

const ActivityPositions: FC<Props> = ({
  openTab,
  sessionId,
  setOpenTab,
  initTab,
  onScroll,
  animatedOverviewHeight,
  network
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  const { dispatch } = useBackgroundService()
  const { accountsOps, banners } = useActivityControllerState()
  const { account, dashboardNetworkFilter } = useSelectedAccountControllerState()
  const prevOpenTab = usePrevious(openTab)

  const currentAccountBanners = useMemo(() => {
    return getCurrentAccountBanners(banners, account?.addr)
  }, [banners, account])

  useEffect(() => {
    if (prevOpenTab === 'activity' && openTab !== 'activity') {
      dispatch({ type: 'MAIN_CONTROLLER_ACTIVITY_RESET_ACC_OPS_FILTERS', params: { sessionId } })
    }
  }, [prevOpenTab, openTab, dispatch, sessionId])

  useEffect(() => {
    // Optimization: Don't apply filtration if we are not on Activity tab
    if (!account?.addr || openTab !== 'activity') return

    dispatch({
      type: 'MAIN_CONTROLLER_ACTIVITY_SET_ACC_OPS_FILTERS',
      params: {
        sessionId,
        filters: {
          account: account.addr,
          ...(dashboardNetworkFilter && {
            chainId: dashboardNetworkFilter ? BigInt(dashboardNetworkFilter) : undefined
          })
        },
        pagination: {
          itemsPerPage: ITEMS_PER_PAGE,
          fromPage: 0
        }
      }
    })
  }, [openTab, account?.addr, dispatch, dashboardNetworkFilter, sessionId])

  const renderItem = useCallback(
    ({ item }: any) => {
      if (item === 'header') {
        return (
          <View style={{ backgroundColor: theme.primaryBackground }}>
            <TabsAndSearch
              openTab={openTab}
              setOpenTab={setOpenTab}
              currentTab="activity"
              sessionId={sessionId}
            />

            {!!accountsOps[sessionId] && (
              <View style={spacings.mbMi}>
                {currentAccountBanners.map((banner) => (
                  <Banner
                    key={banner.id}
                    type={banner.type as BannerType}
                    CustomIcon={() => {
                      return (
                        <View style={[flexbox.alignCenter, flexbox.justifyCenter]}>
                          {banner.type === 'info2' ? (
                            <Spinner style={{ width: 20, height: 20 }} variant="info2" />
                          ) : (
                            <View
                              style={{
                                width: 20,
                                height: 20,
                                borderWidth: 2,
                                borderRadius: 50,
                                borderColor: theme[`${banner.type as BannerType}Decorative`]
                              }}
                            />
                          )}
                          <Text
                            fontSize={12}
                            weight="semiBold"
                            style={{ position: 'absolute' }}
                            appearance={`${banner.type as BannerType}Text`}
                          >
                            {banner.meta!.accountOpsCount}
                          </Text>
                        </View>
                      )
                    }}
                    title={banner.title}
                    text={banner.text}
                    style={{ minHeight: 28, ...spacings.mbTy }}
                    contentContainerStyle={{ minHeight: 28 }}
                  />
                ))}
              </View>
            )}
          </View>
        )
      }

      if (item === 'empty') {
        return (
          <View style={styles.noPositionsWrapper}>
            <InfoIcon width={32} height={32} color={theme.info3Decorative} style={spacings.mtSm} />
            <Text
              testID="no-transaction-history-text"
              fontSize={16}
              weight="medium"
              style={styles.noPositions}
            >
              {t(
                "Ambire doesn't retrieve transactions made\n before installing the extension, but you can \ncheck your address on "
              )}
              <TouchableOpacity
                onPress={() =>
                  openInTab({
                    url: blockExplorerUrl(
                      network?.explorerUrl || 'https://etherscan.io',
                      account!.addr
                    ),
                    shouldCloseCurrentWindow: isRequestWindow
                  })
                }
              >
                <Text weight="medium" color={theme.linkText} style={{ textDecorationLine: 'none' }}>
                  {blockExplorerName(network?.explorerUrl || 'https://etherscan.io')}
                </Text>
              </TouchableOpacity>
              .
            </Text>
          </View>
        )
      }

      if (!initTab?.activity || !item || item === 'keep-this-to-avoid-key-warning') return null

      if (item === 'skeleton') {
        return <ActivityPositionsSkeleton amount={4} />
      }

      if (item === 'load-more') {
        if (!accountsOps[sessionId]) return null

        const { result } = accountsOps[sessionId]
        const hasMoreTxnToLoad = result.currentPage + 1 < result.maxPages

        if (!hasMoreTxnToLoad) return null

        return (
          <View>
            <Button
              type="secondary"
              size="small"
              style={[flexbox.alignSelfCenter, spacings.mbSm]}
              onPress={() => {
                dispatch({
                  type: 'MAIN_CONTROLLER_ACTIVITY_SET_ACC_OPS_FILTERS',
                  params: {
                    sessionId,
                    filters: {
                      account: account!.addr,
                      ...(dashboardNetworkFilter && {
                        chainId: dashboardNetworkFilter ? BigInt(dashboardNetworkFilter) : undefined
                      })
                    },
                    pagination: {
                      itemsPerPage:
                        accountsOps[sessionId]?.pagination.itemsPerPage || +ITEMS_PER_PAGE,
                      fromPage: 0
                    }
                  }
                })
              }}
              text={t('Show more')}
            />
          </View>
        )
      }

      return (
        <SubmittedTransactionSummary
          key={item.txnId}
          defaultType="summary"
          submittedAccountOp={item}
          style={spacings.mbSm}
          size="md"
        />
      )
    },
    [
      initTab?.activity,
      theme,
      openTab,
      setOpenTab,
      sessionId,
      accountsOps,
      currentAccountBanners,
      t,
      network?.explorerUrl,
      account,
      dispatch,
      dashboardNetworkFilter
    ]
  )

  const keyExtractor = useCallback((positionOrElement: any) => {
    if (typeof positionOrElement === 'string') return positionOrElement

    return positionOrElement.txnId
  }, [])

  return (
    <DashboardPageScrollContainer
      tab="activity"
      openTab={openTab}
      ListHeaderComponent={<DashboardBanners />}
      data={[
        'header',
        !accountsOps ? 'skeleton' : 'keep-this-to-avoid-key-warning',
        ...(initTab?.activity && accountsOps?.[sessionId]?.result.items.length
          ? accountsOps[sessionId].result.items
          : []),
        accountsOps?.[sessionId] && !accountsOps[sessionId].result.items.length ? 'empty' : '',
        'load-more'
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

export default React.memo(ActivityPositions)

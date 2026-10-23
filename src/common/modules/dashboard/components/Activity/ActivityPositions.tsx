import React, { FC, Suspense, useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { BannerType } from '@ambire-common/interfaces/banner'
import { Network } from '@ambire-common/interfaces/network'
import { SubmittedAccountOp } from '@ambire-common/libs/accountOp/submittedAccountOp'
import { getCurrentAccountBanners } from '@ambire-common/libs/banners/banners'
import InfoIcon from '@common/assets/svg/InfoIcon'
import Banner from '@common/components/Banner'
import Button from '@common/components/Button'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useControllerSession from '@common/hooks/useControllerSession'
import useTheme from '@common/hooks/useTheme'
import ActivityPositionsSkeleton from '@common/modules/dashboard/components/Activity/ActivityPositionsSkeleton'
import PendingTransactions from '@common/modules/dashboard/components/Activity/PendingTransactions/lazyPendingTransactions'
import DashboardPageScrollContainer from '@common/modules/dashboard/components/DashboardPageScrollContainer'
import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'
import SubmittedTransactionSummary, {
  preloadSummaryPreview
} from '@common/modules/settings/components/TransactionHistory/SubmittedTransactionSummary'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'
import { getUiType } from '@common/utils/uiType'

import styles from './styles'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

interface Props {
  openTab: TabType
  initTab?: { [key: string]: boolean }
  sessionId: string
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

type Item =
  | SubmittedAccountOp
  | 'header'
  | 'pending'
  | 'empty'
  | 'keep-this-to-avoid-key-warning'
  | 'skeleton'
  | 'load-more'

const selectAccountsOps = (state: AllControllersMappingType['ActivityController']) =>
  state.accountsOps
const selectBanners = (state: AllControllersMappingType['ActivityController']) => state.banners
const selectAccount = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account
const selectDashboardNetworkFilter = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.dashboardNetworkFilter

const ActivityPositions: FC<Props> = ({ openTab, sessionId, initTab, network }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  const { state: accountsOps, dispatch: activityDispatch } = useController(
    'ActivityController',
    selectAccountsOps
  )
  const { state: banners } = useController('ActivityController', selectBanners)
  // Read as slices rather than off the whole state, so the page does not re-render on
  // every portfolio tick - it holds no portfolio data of its own.
  const { state: account } = useController('SelectedAccountController', selectAccount)
  const { state: dashboardNetworkFilter } = useController(
    'SelectedAccountController',
    selectDashboardNetworkFilter
  )

  const currentAccountBanners = useMemo(() => {
    return getCurrentAccountBanners(banners, account?.addr)
  }, [banners, account])

  const isActivityTabOpen = openTab === 'activity'

  // Warm the humanizer-carrying preview chunk while the account ops are still loading, so
  // rows render their final content in one step instead of flashing a skeleton on mount.
  // Only once the tab is opened: the carousel keeps this page mounted from the start, and
  // the chunk (~3MB) must not be downloaded on every dashboard load.
  useEffect(() => {
    if (!isActivityTabOpen) return

    void preloadSummaryPreview()
  }, [isActivityTabOpen])

  // The filtered set of account ops is the session: it is what the list renders,
  // and what tells an account with no transactions apart from one whose
  // transactions have not been asked for yet. Tied to the screen being the one the
  // user is on rather than to an effect, because the session is closed while the
  // user is elsewhere - and it is this that asks for it again on the way back.
  useControllerSession({
    // Optimization: Don't apply filtration if we are not on Activity tab
    isEnabled: isActivityTabOpen && !!account?.addr,
    reopenOn: `${account?.addr}-${dashboardNetworkFilter ?? ''}`,
    open: () =>
      activityDispatch({
        type: 'method',
        params: {
          method: 'filterAccountsOps',
          args: [
            sessionId,
            {
              account: account!.addr,
              ...(dashboardNetworkFilter && {
                chainId: dashboardNetworkFilter ? BigInt(dashboardNetworkFilter) : undefined
              })
            },
            {
              itemsPerPage: ITEMS_PER_PAGE,
              fromPage: 0
            }
          ]
        }
      }),
    close: () =>
      activityDispatch({
        type: 'method',
        params: { method: 'resetAccountsOpsFilters', args: [sessionId] }
      })
  })

  const renderItem = useCallback(
    ({ item }: { item: Item }) => {
      // The banners of the account's pending transactions, which the tabs row the carousel
      // lays over the page used to sit above. Web only, as mobile never had them here
      if (item === 'header') {
        return (
          <View style={{ backgroundColor: theme.primaryBackground }}>
            {!!accountsOps[sessionId] && (
              <View style={spacings.mbMi}>
                {currentAccountBanners.map((banner) => (
                  <Banner
                    key={banner.id}
                    type={banner.type as BannerType}
                    CustomIcon={() => {
                      return (
                        <View style={[flexbox.alignCenter, flexbox.justifyCenter]}>
                          {banner.type === 'info' ? (
                            <Spinner style={{ width: 20, height: 20 }} variant="info" />
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
            <InfoIcon width={32} height={32} color={theme.infoText} style={spacings.mtSm} />
            <Text
              testID="no-transaction-history-text"
              fontSize={16}
              weight="medium"
              style={styles.noPositions}
            >
              {t(
                `Ambire doesn't retrieve transactions made${isWeb ? '\n' : ''} before installing the ${isMobile ? 'app' : 'extension'}, but you can ${isWeb ? '\n' : ''}check your address on `
              )}
              <Text
                weight="medium"
                color={theme.linkText}
                fontSize={16}
                style={{ textDecorationLine: 'none' }}
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
                {blockExplorerName(network?.explorerUrl || 'https://etherscan.io')}
              </Text>
              .
            </Text>
          </View>
        )
      }

      // Not held back until the tab is first opened like the rows, so it is already in place
      // while the carousel slides the page in
      if (item === 'skeleton') {
        return <ActivityPositionsSkeleton amount={4} />
      }

      if (!initTab?.activity || !item || item === 'keep-this-to-avoid-key-warning') return null

      if (item === 'pending') {
        if (!account?.safeCreation) return null

        return (
          <Suspense fallback={null}>
            <PendingTransactions />
          </Suspense>
        )
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
                activityDispatch({
                  type: 'method',
                  params: {
                    method: 'filterAccountsOps',
                    args: [
                      sessionId,
                      {
                        account: account!.addr,
                        ...(dashboardNetworkFilter && {
                          chainId: dashboardNetworkFilter
                            ? BigInt(dashboardNetworkFilter)
                            : undefined
                        })
                      },
                      {
                        itemsPerPage:
                          (accountsOps[sessionId]?.pagination.itemsPerPage || 0) + ITEMS_PER_PAGE,
                        fromPage: 0
                      }
                    ]
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
          key={`${item.id}-${item.txnId}-${item.timestamp}`}
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
      sessionId,
      accountsOps,
      currentAccountBanners,
      t,
      network?.explorerUrl,
      account,
      activityDispatch,
      dashboardNetworkFilter
    ]
  )

  const keyExtractor = useCallback((positionOrElement: Item) => {
    if (typeof positionOrElement === 'string') return positionOrElement

    return `${positionOrElement.id}-${positionOrElement.txnId}-${positionOrElement.timestamp}`
  }, [])

  // The transactions are not searchable, so the bar carries the network picker alone.
  // Rendered by the carousel above the pages, so it stays put through a swipe
  const floatingBar = useMemo(() => ({ networkFilterTab: 'activity' as const }), [])

  return (
    <DashboardPageScrollContainer
      floatingBar={floatingBar}
      tab="activity"
      openTab={openTab}
      data={[
        ...(isWeb ? ['header'] : []),
        'pending',
        // Until this session's result arrives it is unknown whether the account has any
        // activity, so the rows are held by a skeleton instead of an empty page.
        !accountsOps?.[sessionId] ? 'skeleton' : 'keep-this-to-avoid-key-warning',
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
      scrollEventThrottle={16}
    />
  )
}

export default React.memo(ActivityPositions)

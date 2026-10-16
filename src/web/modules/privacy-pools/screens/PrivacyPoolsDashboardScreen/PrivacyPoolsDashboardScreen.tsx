import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Animated, View } from 'react-native'

import { getPrivacyPoolsChainConfig } from '@ambire-common/consts/privacyPools'
import Alert from '@common/components/Alert'
import Banner from '@common/components/Banner'
import LayoutWrapper from '@common/components/LayoutWrapper'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import usePrivacyPoolsAccounts from '@common/hooks/usePrivacyPoolsAccounts'
import useTheme from '@common/hooks/useTheme'
import RecoveryPhraseBackupBanner from '@common/modules/dashboard/components/DashboardBanners/RecoveryPhraseBackupBanner'
import { OVERVIEW_CONTENT_MAX_HEIGHT } from '@common/modules/dashboard/components/DashboardOverview/DashboardOverview'
import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'
import getDashboardStyles from '@common/modules/dashboard/screens/styles'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import PrivacyPoolsActivityPage from '@web/modules/privacy-pools/components/PrivacyPoolsActivityPage'
import PrivacyPoolsOverview from '@web/modules/privacy-pools/components/PrivacyPoolsOverview'
import PrivacyPoolsTokensPage from '@web/modules/privacy-pools/components/PrivacyPoolsTokensPage'
import usePrivacyPools from '@web/modules/privacy-pools/hooks/usePrivacyPools'
import usePrivacyPoolsTokens from '@web/modules/privacy-pools/hooks/usePrivacyPoolsTokens'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const SESSION_ID = 'privacy-pools-dashboard'

const selectDashboardNetworkFilter = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.dashboardNetworkFilter

/** Replaces the regular dashboard while a Privacy Pools account is selected. */
const PrivacyPoolsDashboardScreen = () => {
  const { styles } = useTheme(getDashboardStyles)
  const {
    unavailableReason,
    isAvailable,
    hasSyncedAnyChain,
    isSyncingAnyChain,
    hasSyncError,
    networkRows,
    balances,
    balancesState,
    totalPrivateBalance,
    tokenBalances,
    getNetworkName,
    syncAllChains,
    syncIfStale
  } = usePrivacyPools()
  const { selectedAccountId, selectedAccount } = usePrivacyPoolsAccounts()
  const isBackedUp = !!selectedAccount?.isBackedUp
  const { t } = useTranslation()
  const { withdrawTokens } = usePrivacyPoolsTokens({ tokenBalances, getNetworkName })

  const route = useRoute()
  // Reopens on the tab it was left on, like the regular dashboard
  const [openTab, setOpenTab] = useState<TabType>(() =>
    new URLSearchParams(route?.search).get('tab') === 'activity' ? 'activity' : 'tokens'
  )
  // Nothing collapses here, but the dashboard's page lists expect this value
  const animatedOverviewHeight = useMemo(() => new Animated.Value(OVERVIEW_CONTENT_MAX_HEIGHT), [])
  const { state: dashboardNetworkFilter } = useController(
    'SelectedAccountController',
    selectDashboardNetworkFilter
  )
  const networkFilterName = dashboardNetworkFilter
    ? getNetworkName(String(dashboardNetworkFilter))
    : null

  const { navigate } = useNavigation()

  /**
   * Reads stale networks on open, on switching accounts and once the phrase is backed up (hence
   * `isBackedUp` in the deps). Syncs are queued, so a second account waits for the first.
   */
  useEffect(() => {
    if (!isAvailable || !selectedAccountId) return

    syncIfStale()
  }, [isAvailable, isBackedUp, selectedAccountId, syncIfStale])

  // Includes queued networks, so the banner names them all at once
  const firstSyncNetworkNames = useMemo(
    () =>
      networkRows
        .filter(
          ({ isInitialSyncDone, syncStatus }) =>
            isInitialSyncDone === false && syncStatus === 'syncing'
        )
        .map((row) => row.networkName),
    [networkRows]
  )

  // What can be sent to the account from a public one, by the pools of the networks it is read on
  const depositableSymbols = useMemo(() => {
    const symbols = networkRows.flatMap(
      ({ chainId }) =>
        getPrivacyPoolsChainConfig(BigInt(chainId))
          ?.assets.filter(({ isWithdrawable }) => isWithdrawable)
          .map(({ symbol }) => symbol) || []
    )

    return [...new Set(symbols)]
  }, [networkRows])

  // Only once read: before that, an empty list does not mean an empty account
  const isEmpty = isBackedUp && balancesState === 'ready' && !balances.length
  const topUpText = useMemo(() => {
    if (!depositableSymbols.length) return null

    const tokens =
      depositableSymbols.length === 1
        ? depositableSymbols[0]
        : t('{{tokens}} or {{lastToken}}', {
            tokens: depositableSymbols.slice(0, -1).join(', '),
            lastToken: depositableSymbols[depositableSymbols.length - 1]
          })

    return t(
      'You can top up this private account by sending {{tokens}} from any of your public accounts.',
      { tokens }
    )
  }, [depositableSymbols, t])

  // Above the tabs of both pages, like the regular dashboard's banners
  const banners = useMemo(
    () => (
      <View>
        {/* Under the overview card, like on the regular dashboard */}
        <RecoveryPhraseBackupBanner />
        {isEmpty && !!topUpText && (
          // As the title, as the alert shows its icon on the title's row and the text below it
          <Alert
            type="info"
            size="sm"
            titleWeight="regular"
            title={topUpText}
            style={spacings.mbTy}
          />
        )}
        {/* A first read takes a while. Locking skips queued networks, hence "keep unlocked". */}
        {!!firstSyncNetworkNames.length && (
          <Banner
            type="info"
            title={t('First sync')}
            text={t(
              'Reading {{networks}} for the first time. This happens once and usually takes under a minute. Keep the wallet unlocked - you can use your other accounts meanwhile.',
              { networks: firstSyncNetworkNames.join(', ') }
            )}
          />
        )}
      </View>
    ),
    [firstSyncNetworkNames, isEmpty, t, topUpText]
  )

  // See PrivacyPoolsSendScreen
  const openSend = useCallback(() => navigate(WEB_ROUTES.privacyPoolsSend), [navigate])

  return (
    <LayoutWrapper>
      {/* Laid out like the regular dashboard */}
      <View style={styles.container}>
        <PrivacyPoolsOverview
          hasSyncedAnyChain={hasSyncedAnyChain}
          isSyncing={isSyncingAnyChain}
          hasSyncError={hasSyncError}
          totalPrivateBalance={totalPrivateBalance}
          canSend={!!withdrawTokens.length}
          onRefresh={syncAllChains}
          onSend={openSend}
        />
        <PrivacyPoolsTokensPage
          openTab={openTab}
          setOpenTab={setOpenTab}
          sessionId={SESSION_ID}
          animatedOverviewHeight={animatedOverviewHeight}
          banners={banners}
          balances={balances}
          state={balancesState}
          unavailableReason={unavailableReason}
          isWaitingForBackup={!!selectedAccount && !isBackedUp}
          networkFilterName={networkFilterName}
        />
        <PrivacyPoolsActivityPage
          openTab={openTab}
          setOpenTab={setOpenTab}
          sessionId={SESSION_ID}
          animatedOverviewHeight={animatedOverviewHeight}
          banners={banners}
        />
      </View>
    </LayoutWrapper>
  )
}

export default React.memo(PrivacyPoolsDashboardScreen)

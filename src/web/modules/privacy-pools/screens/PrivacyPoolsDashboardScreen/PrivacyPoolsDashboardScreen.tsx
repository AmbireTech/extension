import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Animated, View } from 'react-native'

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

/**
 * The dashboard of a Privacy Pools account, shown on the dashboard route in place of the regular
 * one while a Privacy Pools account is selected.
 */
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
    pendingPrivateBalance,
    activity,
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
  // Back on the tab it was left on, the way the regular dashboard comes back
  const [openTab, setOpenTab] = useState<TabType>(() =>
    new URLSearchParams(route?.search).get('tab') === 'activity' ? 'activity' : 'tokens'
  )
  // Nothing on this dashboard collapses, but the dashboard's page lists expect one to expand
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
   * Reads the networks when the account is opened - and for another account selected while the
   * screen is up, and once the recovery phrase is backed up - so its balances are current without
   * asking. Only those not read in the last 10 minutes, and only once the phrase is backed up: see
   * the controller's `syncIfStale`. Syncs run one after the other, so opening a second account
   * while the first still syncs only queues it.
   */
  useEffect(() => {
    if (!isAvailable || !selectedAccountId) return

    syncIfStale()
  }, [isAvailable, isBackedUp, selectedAccountId, syncIfStale])

  // Including those still waiting their turn, so the banner names every network in for it at once
  const firstSyncNetworkNames = useMemo(
    () =>
      networkRows
        .filter(
          ({ isInitialSyncDone, syncStatus }) =>
            isInitialSyncDone === false &&
            (syncStatus === 'syncing' || syncStatus === 'initializing')
        )
        .map((row) => row.networkName),
    [networkRows]
  )

  // Above the tabs of both pages, where the regular dashboard shows its banners
  const banners = useMemo(
    () => (
      <View>
        {/* Under the overview card, where the regular dashboard shows it */}
        <RecoveryPhraseBackupBanner />
        {/* The one wait worth explaining: a network read for the first time takes minutes, not
        seconds, and nothing else on screen says why the balance is not there yet. Locking the
        wallet skips the networks still waiting their turn, hence asking to keep it unlocked. */}
        {!!firstSyncNetworkNames.length && (
          <Banner
            type="info"
            title={t('First sync')}
            text={t(
              'Reading {{networks}} for the first time. This happens once and takes up to 5 minutes. Keep the wallet unlocked - you can use your other accounts meanwhile.',
              { networks: firstSyncNetworkNames.join(', ') }
            )}
          />
        )}
      </View>
    ),
    [firstSyncNetworkNames, t]
  )

  // Sending is a screen of its own, laid out like the regular Send - see PrivacyPoolsSendScreen
  const openSend = useCallback(() => navigate(WEB_ROUTES.privacyPoolsSend), [navigate])

  return (
    <LayoutWrapper>
      {/* Laid out like the regular dashboard: the overview card on top, the lists under it */}
      <View style={styles.container}>
        <PrivacyPoolsOverview
          unavailableReason={unavailableReason}
          hasSyncedAnyChain={hasSyncedAnyChain}
          isSyncing={isSyncingAnyChain}
          hasSyncError={hasSyncError}
          isWaitingForBackup={!!selectedAccount && !isBackedUp}
          totalPrivateBalance={totalPrivateBalance}
          pendingPrivateBalance={pendingPrivateBalance}
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
          networkFilterName={networkFilterName}
        />
        <PrivacyPoolsActivityPage
          openTab={openTab}
          setOpenTab={setOpenTab}
          sessionId={SESSION_ID}
          animatedOverviewHeight={animatedOverviewHeight}
          banners={banners}
          activity={activity}
        />
      </View>
    </LayoutWrapper>
  )
}

export default React.memo(PrivacyPoolsDashboardScreen)

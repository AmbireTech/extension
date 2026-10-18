import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Animated, View } from 'react-native'

import { TORNADO_CASH_POOLS } from '@ambire-common/consts/tornadoCash'
import Alert from '@common/components/Alert'
import Banner from '@common/components/Banner'
import LayoutWrapper from '@common/components/LayoutWrapper'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import usePrivateAccounts from '@common/hooks/usePrivateAccounts'
import useRoute from '@common/hooks/useRoute'
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
import useTornadoCash from '@web/modules/tornado-cash/hooks/useTornadoCash'

import type { TornadoCashUnavailableReason } from '@ambire-common/interfaces/tornadoCash'

const SESSION_ID = 'tornado-cash-dashboard'

/** The tokens a Tornado Cash account holds, for the top-up hint. */
const DEPOSITABLE_SYMBOLS = [...new Set(TORNADO_CASH_POOLS.map(({ symbol }) => symbol))]

/**
 * Replaces the regular dashboard while a Tornado Cash account is selected. Built from the Privacy
 * Pools dashboard's pieces: same layout, one network, no review of the funds.
 */
const TornadoCashDashboardScreen = () => {
  const { t } = useTranslation()
  const { styles } = useTheme(getDashboardStyles)
  const {
    unavailableReason,
    isAvailable,
    isSyncing,
    hasSynced,
    hasSyncError,
    isFirstSync,
    balances,
    balancesState,
    totalBalance,
    sync,
    syncIfStale
  } = useTornadoCash()
  const { selectedAccount } = usePrivateAccounts()
  const isBackedUp = !!selectedAccount?.isBackedUp
  const { navigate } = useNavigation()

  const route = useRoute()
  // Reopens on the tab it was left on, like the regular dashboard
  const [openTab, setOpenTab] = useState<TabType>(() =>
    new URLSearchParams(route?.search).get('tab') === 'activity' ? 'activity' : 'tokens'
  )
  // Nothing collapses here, but the dashboard's page lists expect this value
  const animatedOverviewHeight = useMemo(() => new Animated.Value(OVERVIEW_CONTENT_MAX_HEIGHT), [])

  // Reads on open, on switching accounts and once the phrase is backed up (hence `isBackedUp`)
  useEffect(() => {
    if (!isAvailable || !selectedAccount) return

    syncIfStale()
  }, [isAvailable, isBackedUp, selectedAccount, syncIfStale])

  const unavailableTexts: { [reason in TornadoCashUnavailableReason]: string } = useMemo(
    () => ({
      'no-account': t('Select a Tornado Cash account to see what it holds.'),
      'unsupported-platform': t(
        'Tornado Cash works only in the Ambire extension for Chrome for now.'
      ),
      'unsupported-network': t(
        'Tornado Cash runs on Ethereum. Add the Ethereum network to use it.'
      ),
      locked: t('Unlock your wallet to see what you have in Tornado Cash.')
    }),
    [t]
  )

  // Only once read: before that, an empty list does not mean an empty account
  const isEmpty = isBackedUp && balancesState === 'ready' && !balances.length

  const banners = useMemo(
    () => (
      <View>
        <RecoveryPhraseBackupBanner />
        {isEmpty && (
          <Alert
            type="info"
            size="sm"
            titleWeight="regular"
            title={t(
              'You can top up this private account by sending {{tokens}} from any of your public accounts.',
              { tokens: DEPOSITABLE_SYMBOLS.join(', ') }
            )}
            style={spacings.mbTy}
          />
        )}
        {isFirstSync && (
          <Banner
            type="info"
            title={t('First sync')}
            text={t(
              'Reading Tornado Cash for the first time. This usually takes about a minute. Keep the wallet unlocked - you can use your other accounts meanwhile.'
            )}
          />
        )}
      </View>
    ),
    [isEmpty, isFirstSync, t]
  )

  const openSend = useCallback(() => navigate(WEB_ROUTES.tornadoCashSend), [navigate])

  return (
    <LayoutWrapper>
      <View style={styles.container}>
        <PrivacyPoolsOverview
          hasSyncedAnyChain={hasSynced}
          isSyncing={isSyncing}
          hasSyncError={hasSyncError}
          totalPrivateBalance={totalBalance}
          canSend={!!balances.length}
          onRefresh={sync}
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
          unavailableReason={null}
          unavailableText={unavailableReason ? unavailableTexts[unavailableReason] : undefined}
          isWaitingForBackup={!!selectedAccount && !isBackedUp}
          networkFilterName={null}
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

export default React.memo(TornadoCashDashboardScreen)

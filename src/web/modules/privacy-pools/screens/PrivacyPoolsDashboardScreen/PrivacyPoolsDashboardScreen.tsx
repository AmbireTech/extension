import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'

import LayoutWrapper from '@common/components/LayoutWrapper'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import DashboardHeader from '@common/modules/dashboard/components/DashboardHeader'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import PrivacyPoolsActivity from '@web/modules/privacy-pools/components/PrivacyPoolsActivity'
import PrivacyPoolsBackupBanner from '@web/modules/privacy-pools/components/PrivacyPoolsBackupBanner'
import PrivacyPoolsBalances from '@web/modules/privacy-pools/components/PrivacyPoolsBalances'
import PrivacyPoolsNetworks from '@web/modules/privacy-pools/components/PrivacyPoolsNetworks'
import PrivacyPoolsOverview from '@web/modules/privacy-pools/components/PrivacyPoolsOverview'
import PrivacyPoolsTabs, {
  PrivacyPoolsTab
} from '@web/modules/privacy-pools/components/PrivacyPoolsTabs'
import usePrivacyPools from '@web/modules/privacy-pools/hooks/usePrivacyPools'
import usePrivacyPoolsTokens from '@web/modules/privacy-pools/hooks/usePrivacyPoolsTokens'

import getStyles from './styles'

/**
 * The dashboard of a Privacy Pools account, shown on the dashboard route in place of the regular
 * one while a Privacy Pools account is selected.
 */
const PrivacyPoolsDashboardScreen = () => {
  const { styles } = useTheme(getStyles)
  const {
    unavailableReason,
    isAvailable,
    hasSyncedAnyChain,
    isSyncingAnyChain,
    networkRows,
    balances,
    balancesState,
    totalPrivateBalance,
    pendingPrivateBalance,
    activity,
    syncChain,
    refreshLoadedChains
  } = usePrivacyPools()
  const { withdrawTokens } = usePrivacyPoolsTokens()

  const [openTab, setOpenTab] = useState<PrivacyPoolsTab>('pooled')

  const { navigate } = useNavigation()

  /**
   * Re-reads the networks already read on this device, once per mount.
   *
   * Deliberately not every supported network: a first read walks the chain from the entrypoint's
   * deployment block, which on Ethereum is long enough that it has to be asked for rather than
   * started by opening a screen. Refreshing what is already there is cheap and catches a deposit
   * made from another device.
   */
  const hasRefreshedOnOpen = useRef(false)

  useEffect(() => {
    if (!isAvailable || hasRefreshedOnOpen.current) return

    hasRefreshedOnOpen.current = true
    refreshLoadedChains()
  }, [isAvailable, refreshLoadedChains])

  // Sending is a screen of its own, laid out like the regular Send - see PrivacyPoolsSendScreen
  const openSend = useCallback(() => navigate(WEB_ROUTES.privacyPoolsSend), [navigate])

  return (
    <LayoutWrapper>
      <View style={styles.header}>
        <View style={styles.content}>
          <DashboardHeader />
        </View>
      </View>
      <ScrollableWrapper contentContainerStyle={styles.contentContainer}>
        <View style={styles.content}>
          <PrivacyPoolsBackupBanner />
          <View style={spacings.mbSm}>
            <PrivacyPoolsOverview
              unavailableReason={unavailableReason}
              hasSyncedAnyChain={hasSyncedAnyChain}
              isSyncing={isSyncingAnyChain}
              totalPrivateBalance={totalPrivateBalance}
              pendingPrivateBalance={pendingPrivateBalance}
              canSend={!!withdrawTokens.length}
              onRefresh={refreshLoadedChains}
              onSend={openSend}
            />
          </View>

          {/* Each network is read on its own - see PrivacyPoolsNetworks. Hidden when the account
        cannot use Privacy Pools at all, since then there is nothing to read either. */}
          {isAvailable && (
            <View style={spacings.mbSm}>
              <PrivacyPoolsNetworks rows={networkRows} onSync={syncChain} />
            </View>
          )}

          <PrivacyPoolsTabs openTab={openTab} setOpenTab={setOpenTab} />
          {openTab === 'pooled' ? (
            <PrivacyPoolsBalances balances={balances} state={balancesState} />
          ) : (
            <PrivacyPoolsActivity activity={activity} />
          )}
        </View>
      </ScrollableWrapper>
    </LayoutWrapper>
  )
}

export default React.memo(PrivacyPoolsDashboardScreen)

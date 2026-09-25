import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'

import Alert from '@common/components/Alert'
import LayoutWrapper from '@common/components/LayoutWrapper'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import usePrivacyPoolsAccounts from '@common/hooks/usePrivacyPoolsAccounts'
import useTheme from '@common/hooks/useTheme'
import RecoveryPhraseBackupBanner from '@common/modules/dashboard/components/DashboardBanners/RecoveryPhraseBackupBanner'
import getDashboardStyles from '@common/modules/dashboard/screens/styles'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import PrivacyPoolsActivity from '@web/modules/privacy-pools/components/PrivacyPoolsActivity'
import PrivacyPoolsBalances from '@web/modules/privacy-pools/components/PrivacyPoolsBalances'
import PrivacyPoolsNetworks from '@web/modules/privacy-pools/components/PrivacyPoolsNetworks'
import PrivacyPoolsOverview from '@web/modules/privacy-pools/components/PrivacyPoolsOverview'
import PrivacyPoolsTabs, {
  PrivacyPoolsTab
} from '@web/modules/privacy-pools/components/PrivacyPoolsTabs'
import usePrivacyPools from '@web/modules/privacy-pools/hooks/usePrivacyPools'
import usePrivacyPoolsTokens from '@web/modules/privacy-pools/hooks/usePrivacyPoolsTokens'

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
    networkRows,
    balances,
    balancesState,
    totalPrivateBalance,
    pendingPrivateBalance,
    activity,
    syncChain,
    syncAllChains
  } = usePrivacyPools()
  const { selectedAccountId } = usePrivacyPoolsAccounts()
  const { t } = useTranslation()
  const { withdrawTokens } = usePrivacyPoolsTokens()

  const [openTab, setOpenTab] = useState<PrivacyPoolsTab>('tokens')

  const { navigate } = useNavigation()

  /**
   * Reads every supported network when the account is opened - and again for another account
   * selected while the screen is up - so its balances are current without asking. Syncs run one
   * after the other, so opening a second account while the first still syncs only queues it.
   */
  const syncedAccountId = useRef<string | null>(null)

  useEffect(() => {
    if (!isAvailable || !selectedAccountId || syncedAccountId.current === selectedAccountId) return

    syncedAccountId.current = selectedAccountId
    syncAllChains()
  }, [isAvailable, selectedAccountId, syncAllChains])

  const firstReadNetworkNames = useMemo(
    () =>
      networkRows
        .filter(({ syncStatus }) => syncStatus === 'initializing')
        .map((row) => row.networkName),
    [networkRows]
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
          totalPrivateBalance={totalPrivateBalance}
          pendingPrivateBalance={pendingPrivateBalance}
          canSend={!!withdrawTokens.length}
          onRefresh={syncAllChains}
          onSend={openSend}
        />
        <ScrollableWrapper contentContainerStyle={[spacings.phSm, spacings.pbSm]}>
          {/* Under the overview card, where the regular dashboard shows it */}
          <RecoveryPhraseBackupBanner />
          {/* The one wait worth explaining: a network read for the first time takes minutes, not
          seconds, and nothing else on screen says why the balance is not there yet */}
          {!!firstReadNetworkNames.length && (
            <Alert
              type="info"
              size="sm"
              style={spacings.mbSm}
              text={t(
                'Checking {{networks}} for the first time. This can take a few minutes - you can keep using the wallet meanwhile.',
                { networks: firstReadNetworkNames.join(', ') }
              )}
            />
          )}
          {/* Each network is read on its own - see PrivacyPoolsNetworks. Hidden when the account
        cannot use Privacy Pools at all, since then there is nothing to read either. */}
          {isAvailable && (
            <View style={spacings.mbSm}>
              <PrivacyPoolsNetworks rows={networkRows} onSync={syncChain} />
            </View>
          )}

          <PrivacyPoolsTabs openTab={openTab} setOpenTab={setOpenTab} />
          {openTab === 'tokens' ? (
            <PrivacyPoolsBalances balances={balances} state={balancesState} />
          ) : (
            <PrivacyPoolsActivity activity={activity} />
          )}
        </ScrollableWrapper>
      </View>
    </LayoutWrapper>
  )
}

export default React.memo(PrivacyPoolsDashboardScreen)

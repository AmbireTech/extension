import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { getPrivacyPoolsAsset } from '@ambire-common/consts/privacyPools'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import PrivacyPoolsActionSheet, {
  PrivacyPoolsActionSubmitParams
} from '@web/modules/privacy-pools/components/PrivacyPoolsActionSheet'
import PrivacyPoolsActivity from '@web/modules/privacy-pools/components/PrivacyPoolsActivity'
import PrivacyPoolsBalances from '@web/modules/privacy-pools/components/PrivacyPoolsBalances'
import PrivacyPoolsNetworks from '@web/modules/privacy-pools/components/PrivacyPoolsNetworks'
import PrivacyPoolsOverview from '@web/modules/privacy-pools/components/PrivacyPoolsOverview'
import PrivacyPoolsTabs, {
  PrivacyPoolsTab
} from '@web/modules/privacy-pools/components/PrivacyPoolsTabs'
import PrivacyPoolsWithdrawalSheet from '@web/modules/privacy-pools/components/PrivacyPoolsWithdrawalSheet'
import usePrivacyPools from '@web/modules/privacy-pools/hooks/usePrivacyPools'
import usePrivacyPoolsTokens from '@web/modules/privacy-pools/hooks/usePrivacyPoolsTokens'
import { PrivacyPoolsActionMode } from '@web/modules/privacy-pools/types'
import { SettingsRoutesContext } from '@web/modules/settings/contexts/SettingsRoutesContext'

import getStyles from './styles'

const PrivacyPoolsScreen = () => {
  const { styles } = useTheme(getStyles)
  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)
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
    hasUnpricedTokens,
    activity,
    operation,
    getNetworkName,
    syncChain,
    refreshLoadedChains,
    deposit,
    prepareWithdrawal,
    broadcastWithdrawal,
    dismissOperation
  } = usePrivacyPools()
  const { depositTokens, withdrawTokens } = usePrivacyPoolsTokens()

  const [openTab, setOpenTab] = useState<PrivacyPoolsTab>('pooled')
  // One sheet for both forms - only one can be open at a time, and they differ by `mode`.
  const [actionMode, setActionMode] = useState<PrivacyPoolsActionMode>('deposit')

  const { ref: actionSheetRef, open: openActionSheet, close: closeActionSheet } = useModalize()
  const {
    ref: withdrawalSheetRef,
    open: openWithdrawalSheet,
    close: closeWithdrawalSheet
  } = useModalize()

  useEffect(() => {
    setCurrentSettingsPage('privacy-pools')
  }, [setCurrentSettingsPage])

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

  /**
   * Brings the sheet back for the confirmation.
   *
   * Closing it while the proof is being built does not cancel anything - the controller refuses to
   * drop a withdrawal in flight - so without this a user who closed it would be left with a proved
   * withdrawal waiting on a confirmation that is nowhere on screen.
   */
  const operationPhase = operation?.phase
  const operationStatus = operation?.status

  useEffect(() => {
    if (operationStatus !== 'pending' || operationPhase !== 'ready') return

    openWithdrawalSheet()
  }, [operationStatus, operationPhase, openWithdrawalSheet])

  const openAction = useCallback(
    (mode: PrivacyPoolsActionMode) => () => {
      setActionMode(mode)
      openActionSheet()
    },
    [openActionSheet]
  )

  /**
   * Opens the progress sheet as the withdrawal is dispatched, rather than waiting for the
   * background to report back: quoting and proving take about ten seconds together, which would
   * otherwise be a closed form and nothing to look at.
   */
  const handleSubmit = useCallback(
    (params: PrivacyPoolsActionSubmitParams) => {
      if (actionMode === 'deposit') {
        // No sheet: a deposit is an ordinary transaction and opens the normal signing flow, which
        // has its own progress UI.
        deposit({
          chainId: params.chainId,
          tokenAddress: params.tokenAddress,
          amount: params.amount
        })
        return
      }

      openWithdrawalSheet()
      prepareWithdrawal(params)
    },
    [actionMode, deposit, prepareWithdrawal, openWithdrawalSheet]
  )

  // The withdrawal in flight is described in the token's own units, which only the pool's asset
  // config knows - the operation itself carries raw amounts.
  const operationAsset = useMemo(() => {
    if (!operation) return null

    return getPrivacyPoolsAsset(BigInt(operation.chainId), operation.tokenAddress)
  }, [operation])

  return (
    <ScrollableWrapper contentContainerStyle={styles.contentContainer}>
      <View style={styles.content}>
        <View style={spacings.mbSm}>
          <PrivacyPoolsOverview
            unavailableReason={unavailableReason}
            hasSyncedAnyChain={hasSyncedAnyChain}
            isSyncing={isSyncingAnyChain}
            totalPrivateBalance={totalPrivateBalance}
            pendingPrivateBalance={pendingPrivateBalance}
            hasUnpricedTokens={hasUnpricedTokens}
            canWithdraw={!!withdrawTokens.length}
            onRefresh={refreshLoadedChains}
            onDeposit={openAction('deposit')}
            onWithdraw={openAction('withdraw')}
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

      <PrivacyPoolsActionSheet
        mode={actionMode}
        tokens={actionMode === 'deposit' ? depositTokens : withdrawTokens}
        sheetRef={actionSheetRef}
        closeBottomSheet={closeActionSheet}
        onSubmit={handleSubmit}
      />
      <PrivacyPoolsWithdrawalSheet
        operation={operation}
        symbol={operationAsset?.symbol || ''}
        decimals={operationAsset?.decimals ?? 18}
        networkName={operation ? getNetworkName(operation.chainId) : ''}
        sheetRef={withdrawalSheetRef}
        closeBottomSheet={closeWithdrawalSheet}
        onSend={broadcastWithdrawal}
        onClosed={dismissOperation}
      />
    </ScrollableWrapper>
  )
}

export default React.memo(PrivacyPoolsScreen)

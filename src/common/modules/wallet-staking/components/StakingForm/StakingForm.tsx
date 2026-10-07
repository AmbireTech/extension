import React from 'react'
import { ScrollView, View } from 'react-native'

import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import EmptyState from '@common/modules/wallet-staking/components/EmptyState'
import PendingWithdrawalCard, {
  MissingWithdrawalDetails
} from '@common/modules/wallet-staking/components/PendingWithdrawalCard'
import StakingAmountCard from '@common/modules/wallet-staking/components/StakingAmountCard'
import StakingDetailsCard from '@common/modules/wallet-staking/components/StakingDetailsCard'
import StakingTabs from '@common/modules/wallet-staking/components/StakingTabs'

import LearnMoreLink from './LearnMoreLink'
import getStyles from './styles'

import type { WalletStakingFormState } from '@common/modules/wallet-staking/hooks/useWalletStakingForm'

const SPINNER_STYLE = { width: 28, height: 28 }

interface Props {
  form: WalletStakingFormState
}

/** The scrollable body of the $WALLET Staking screen, shared by the mobile and web screens. */
const StakingForm = ({ form }: Props) => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const {
    mode,
    onSelectMode,
    isMissingWithdrawalDetails,
    isWithdrawalsLookupEnabled,
    onEnableWithdrawalsLookup,
    withdrawalTxnId,
    onWithdrawalTxnIdChange,
    onFindWithdrawalByTxnId,
    txnIdLookupError,
    isTxnIdLookupLoading,
    isPendingWithdrawalMode,
    isWithdrawalReady,
    pendingWithdrawalAmount,
    pendingWithdrawalTime,
    shouldDisableStakingForm,
    shouldShowPendingWithdrawalLoader,
    shouldShowEmptyState,
    onBuyWallet
  } = form

  return (
    <ScrollView
      style={styles.mainContent}
      contentContainerStyle={styles.mainContentContent}
      showsVerticalScrollIndicator={false}
    >
      <LearnMoreLink />
      <StakingTabs mode={mode} onSelect={onSelectMode} />

      {shouldShowPendingWithdrawalLoader ? (
        <View style={styles.loadingState}>
          <Text fontSize={24}>{t('Loading...')}</Text>
          <Spinner style={SPINNER_STYLE} />
        </View>
      ) : (
        <View style={styles.stakingFormContainer}>
          {isMissingWithdrawalDetails && (
            <MissingWithdrawalDetails
              isWithdrawalsLookupEnabled={isWithdrawalsLookupEnabled}
              txnId={withdrawalTxnId}
              onTxnIdChange={onWithdrawalTxnIdChange}
              onFindByTxnId={onFindWithdrawalByTxnId}
              txnIdLookupError={txnIdLookupError}
              isTxnIdLookupLoading={isTxnIdLookupLoading}
              onEnableWithdrawalsLookup={onEnableWithdrawalsLookup}
            />
          )}

          {isPendingWithdrawalMode && (
            <PendingWithdrawalCard
              amount={pendingWithdrawalAmount}
              timeLeft={pendingWithdrawalTime}
              isReady={isWithdrawalReady}
            />
          )}

          {shouldShowEmptyState ? (
            <EmptyState onBuyWalletPress={onBuyWallet} />
          ) : (
            <View
              pointerEvents={shouldDisableStakingForm ? 'none' : 'auto'}
              style={shouldDisableStakingForm ? styles.disabledStakingForm : undefined}
            >
              <View style={styles.amountSection}>
                <StakingAmountCard form={form} />
              </View>
              <StakingDetailsCard form={form} />
            </View>
          )}
        </View>
      )}
    </ScrollView>
  )
}

export default React.memo(StakingForm)

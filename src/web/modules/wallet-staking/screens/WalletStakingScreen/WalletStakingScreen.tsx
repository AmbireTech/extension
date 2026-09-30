import React from 'react'
import { View } from 'react-native'

import LayoutWrapper from '@common/components/LayoutWrapper'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import Header from '@common/modules/header/components/Header/Header'
import FeeInfoBottomSheet from '@common/modules/swap-and-bridge/components/FeeInfoBottomSheet'
import StakingFooter from '@common/modules/wallet-staking/components/StakingFooter'
import StakingForm from '@common/modules/wallet-staking/components/StakingForm'
import useWalletStakingForm from '@common/modules/wallet-staking/hooks/useWalletStakingForm'

import getStyles from './styles'

const WalletStakingScreen = () => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const form = useWalletStakingForm()

  return (
    <LayoutWrapper>
      <Header.Wrapper>
        <Header.Container side="left">
          <Header.BackButton forceBack onGoBackPress={form.onBack} />
        </Header.Container>
        <Header.Title>{t('$WALLET Staking')}</Header.Title>
        <Header.Container side="right" />
      </Header.Wrapper>
      <View style={styles.screenContent}>
        <StakingForm form={form} />
        {!form.shouldShowPendingWithdrawalLoader && !form.shouldShowEmptyState && (
          <StakingFooter form={form} />
        )}
        <FeeInfoBottomSheet
          sheetRef={form.feeInfoSheetRef}
          closeBottomSheet={form.closeFeeInfoBottomSheet}
          feePercent={form.currentFeePercent}
          withActions={false}
        />
      </View>
    </LayoutWrapper>
  )
}

export default React.memo(WalletStakingScreen)

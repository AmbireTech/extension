import React from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import DetailRow from '@common/modules/wallet-staking/components/DetailRow'
import StakingApy from '@common/modules/wallet-staking/components/StakingApy'

import getStyles from './styles'

import type { WalletStakingFormState } from '@common/modules/wallet-staking/hooks/useWalletStakingForm'

interface Props {
  form: WalletStakingFormState
}

/** The Swap & Bridge fee tier preview, the APY and - while unstaking - the unbond period. */
const StakingDetailsCard = ({ form }: Props) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const {
    mode,
    currentFeePercent,
    projectedFeePercent,
    shouldShowFeePreview,
    onOpenFeeInfoBottomSheet
  } = form

  return (
    <View style={styles.detailsCard}>
      {shouldShowFeePreview && (
        <View style={styles.feePreviewRow}>
          <View style={styles.feePreviewLabel}>
            <Text fontSize={12} appearance="secondaryText">
              {t('Swap & Bridge fee tier')}
            </Text>
            <Button
              text={t('Tier details')}
              type="outline"
              size="tiny"
              accentColor={theme.primaryAccent300}
              onPress={onOpenFeeInfoBottomSheet}
              hasBottomSpacing={false}
              submitOnEnter={false}
              style={styles.feeDetailsButton}
              testID="wallet-staking-fee-details-button"
            />
          </View>
          <View style={styles.feePreviewValues}>
            {projectedFeePercent !== currentFeePercent && (
              <Text fontSize={12} appearance="errorText" style={styles.feePreviewOldFee}>
                {currentFeePercent.toFixed(2)}%
              </Text>
            )}
            <Text fontSize={22} weight="semiBold" color={theme.primaryAccent200}>
              {projectedFeePercent.toFixed(2)}%
            </Text>
          </View>
        </View>
      )}

      <View style={styles.cardDetails}>
        <StakingApy />
        {mode === 'unstake' && (
          <DetailRow label={t('Lock')}>
            <Text fontSize={13} appearance="secondaryText">
              {t('30 days unbond period')}
            </Text>
          </DetailRow>
        )}
      </View>
    </View>
  )
}

export default React.memo(StakingDetailsCard)

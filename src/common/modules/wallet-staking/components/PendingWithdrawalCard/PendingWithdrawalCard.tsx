import React from 'react'
import { View } from 'react-native'

import WithdrawIcon from '@common/assets/svg/WithdrawIcon'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'

import getStyles from './styles'

interface Props {
  amount: string
  timeLeft: string
  isReady: boolean
}

/** Shown over the locked unstake form while a withdrawal is still committed on-chain. */
const PendingWithdrawalCard = ({ amount, timeLeft, isReady }: Props) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)

  return (
    <View style={styles.pendingWithdrawalCard}>
      <View style={styles.pendingWithdrawalIcon}>
        <WithdrawIcon width={54} height={54} color={theme.errorText} />
      </View>
      {isReady ? (
        <>
          <Text fontSize={18} weight="semiBold" style={styles.pendingWithdrawalText}>
            {t('Ready to withdraw')}
          </Text>
          <Text fontSize={24} weight="number_bold" style={styles.pendingWithdrawalText}>
            {amount} $WALLET
          </Text>
        </>
      ) : (
        <>
          <Text fontSize={20} weight="number_bold" style={styles.pendingWithdrawalText}>
            {amount} $WALLET
          </Text>
          <Text fontSize={16} weight="medium" style={styles.pendingWithdrawalText}>
            {t('will be available in')}
          </Text>
          <Text fontSize={24} weight="number_bold" style={styles.pendingWithdrawalText}>
            {timeLeft}
          </Text>
        </>
      )}
      <Text fontSize={13} appearance="secondaryText" style={styles.pendingWithdrawalDescription}>
        {isReady
          ? t('Your $WALLET is ready. Withdraw it before starting another unstake.')
          : t('You can withdraw and unstake more as soon as the locking period has ended.')}
      </Text>
    </View>
  )
}

export default React.memo(PendingWithdrawalCard)

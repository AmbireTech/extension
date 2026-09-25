import React from 'react'
import { View } from 'react-native'

import LockWithTimerIcon from '@common/assets/svg/LockWithTimerIcon'
import SupportLink from '@common/components/SupportLink'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'

import getStyles from './styles'

/**
 * Shown when the staking contract holds shares for a withdrawal we can't describe - the leave
 * event reaches us through the relayer's logs, which lag the transaction, and the cached copy is
 * gone (another device, or cleared storage).
 */
const MissingWithdrawalDetails = () => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)

  return (
    <View style={styles.pendingWithdrawalCard}>
      <View style={styles.pendingWithdrawalIcon}>
        <LockWithTimerIcon width={54} height={54} color={theme.errorText} />
      </View>
      <Text fontSize={18} weight="semiBold" style={styles.pendingWithdrawalText}>
        {t('We couldn’t find your withdrawal details')}
      </Text>
      <Text fontSize={13} appearance="secondaryText" style={styles.pendingWithdrawalDescription}>
        {t(
          'Your $WALLET is locked for a withdrawal, but we can’t load the details of it. If this doesn’t resolve on its own, please '
        )}
        <SupportLink fontSize={13} />
        {t(' and we will help.')}
      </Text>
    </View>
  )
}

export default React.memo(MissingWithdrawalDetails)

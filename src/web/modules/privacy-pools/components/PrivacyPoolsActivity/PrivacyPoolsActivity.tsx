import React from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

import getStyles from './styles'

/**
 * Placeholder until the Privacy Pools SDK can report the account's history from the pools. It is
 * not recorded locally instead, as such a log would link deposits to their withdrawals.
 */
const PrivacyPoolsActivity = () => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)

  return (
    <View style={styles.container}>
      <View style={styles.emptyContainer}>
        <Text fontSize={14} weight="medium" style={spacings.mbMi}>
          {t('Activity is coming soon')}
        </Text>
        <Text fontSize={12} color={theme.secondaryText} style={styles.centeredText}>
          {t('What you send to and from this account will show up here.')}
        </Text>
      </View>
    </View>
  )
}

export default React.memo(PrivacyPoolsActivity)

import React, { useCallback } from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { useTranslation } from '@common/config/localization'
import { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import { openInTab } from '@common/utils/links'

import getStyles from './styles'

const STAKING_HELP_URL = 'https://help.ambire.com/en/collections/18211458-wallet-token-governance'

const LearnMoreLink = () => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const { addToast } = useToast()

  const handleOpenHelp = useCallback(() => {
    openInTab({ url: STAKING_HELP_URL }).catch((error) => {
      console.error('Failed to open WALLET staking help', error)
      captureException(error)
      addToast(t("We couldn't open the staking guide."), { type: 'error' })
    })
  }, [addToast, t])

  return (
    <View style={styles.learnMore}>
      <Text fontSize={14} appearance="secondaryText">
        {t('Learn more about')}{' '}
      </Text>
      <AnimatedPressable onPress={handleOpenHelp}>
        <Text fontSize={14} color={theme.primaryAccent200} underline>
          {t('how staking works')}
        </Text>
      </AnimatedPressable>
    </View>
  )
}

export default React.memo(LearnMoreLink)

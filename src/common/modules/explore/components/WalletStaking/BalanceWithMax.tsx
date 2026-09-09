import React from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

interface Props {
  balanceLabel: string
  disabled: boolean
  onMaxPress: () => void
  testID: string
}

const BalanceWithMax = ({ balanceLabel, disabled, onMaxPress, testID }: Props) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)

  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter]}>
      <Text fontSize={12} appearance="secondaryText">
        {t('Balance: {{balance}}', { balance: balanceLabel })}
      </Text>
      <Button
        text={t('Max')}
        type="outline"
        size="tiny"
        accentColor={theme.primaryAccent300}
        onPress={onMaxPress}
        disabled={disabled}
        hasBottomSpacing={false}
        submitOnEnter={false}
        style={styles.maxButton}
        testID={testID}
      />
    </View>
  )
}

export default React.memo(BalanceWithMax)

import React from 'react'
import { Pressable, View } from 'react-native'

import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import { hexToRgba } from '@common/styles/utils/common'
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
      <Pressable
        style={({ hovered }: any) => [
          styles.maxButton,
          {
            backgroundColor:
              hovered && !disabled
                ? hexToRgba(theme.primaryAccent200, 0.16)
                : theme.primaryAccent100
          },
          disabled && styles.maxButtonDisabled
        ]}
        onPress={onMaxPress}
        disabled={disabled}
      >
        <Text fontSize={12} weight="medium" appearance="primary" testID={testID}>
          {t('Max')}
        </Text>
      </Pressable>
    </View>
  )
}

export default React.memo(BalanceWithMax)

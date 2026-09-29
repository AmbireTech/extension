import React from 'react'
import { Pressable, PressableStateCallbackType, StyleProp, ViewStyle } from 'react-native'

import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import { hexToRgba } from '@common/styles/utils/common'

import getStyles from './styles'

type PressableStateWithHover = PressableStateCallbackType & { hovered?: boolean }

interface Props {
  onPress: () => void
  disabled?: boolean
  testID?: string
  style?: StyleProp<ViewStyle>
}

/** The pill that fills the amount field with everything the account holds. */
const MaxButton = ({ onPress, disabled, testID, style }: Props) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)

  return (
    <Pressable
      style={({ hovered }: PressableStateWithHover) => [
        styles.maxButton,
        {
          backgroundColor:
            hovered && !disabled ? hexToRgba(theme.primaryAccent200, 0.16) : theme.primaryAccent100
        },
        disabled && styles.maxButtonDisabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text fontSize={12} weight="medium" appearance="primary" testID={testID}>
        {t('Max')}
      </Text>
    </Pressable>
  )
}

export default React.memo(MaxButton)

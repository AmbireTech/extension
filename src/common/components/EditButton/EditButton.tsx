import React from 'react'
import { useTranslation } from 'react-i18next'
import { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native'

import EditPenIcon from '@common/assets/svg/EditPenIcon'
import { isMobile } from '@common/config/env'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import flexbox from '@common/styles/utils/flexbox'

import Text from '../Text'

interface Props {
  onPress: (event: GestureResponderEvent) => void
  style?: StyleProp<ViewStyle>
  iconOnly?: boolean
}

const EditButton = ({ onPress, style, iconOnly = false }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [bindEdit, , isHovered] = useHover({ preset: 'opacityInverted' })

  return (
    <AnimatedPressable
      style={[flexbox.directionRow, flexbox.alignCenter, style]}
      {...bindEdit}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={iconOnly ? t('Edit') : undefined}
    >
      {!iconOnly && (
        <Text fontSize={14} color={theme.linkText}>
          {'['}
        </Text>
      )}
      <EditPenIcon width={20} height={20} color={theme.linkText} />
      {!iconOnly && !isMobile && (
        <Text fontSize={14} color={theme.linkText} underline={isHovered}>
          {t('Edit')}
        </Text>
      )}
      {!iconOnly && (
        <Text fontSize={14} color={theme.linkText}>
          {']'}
        </Text>
      )}
    </AnimatedPressable>
  )
}

export default React.memo(EditButton)

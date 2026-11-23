import React, { FC, ReactNode } from 'react'
import { View } from 'react-native'

import CloseIcon from '@common/assets/svg/CloseIcon'
import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import HoverablePressable from '@common/components/HoverablePressable'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'

import { getHeaderIconStrokeWidth } from './constants'
import HeaderButtonSurface from './HeaderButtonSurface'

type Props = {
  onPress: () => void
  testID?: string
  disabled?: boolean
} & (
  | { type: 'close' | 'back' }
  /**
   * Any other header action, like a settings or scan icon. Draw it about 16px big in
   * `theme.primaryText`, with `getHeaderIconStrokeWidth` for its stroke, like the iOS toolbar symbols
   */
  | { icon: ReactNode; accessibilityLabel: string }
)

// Faded like the other disabled buttons, without changing their colors
const DISABLED_STYLE = { opacity: 0.3 }

/**
 * A round button of a screen or sheet header: the ‹ back, the X or another action.
 * Liquid Glass on iOS 26+, a solid circle elsewhere.
 */
const HeaderButton: FC<Props> = (props) => {
  const { onPress, testID, disabled } = props
  const { t } = useTranslation()
  const { theme } = useTheme()

  const getContent = () => {
    if ('icon' in props) return { icon: props.icon, label: props.accessibilityLabel }
    if (props.type === 'close') {
      return {
        icon: (
          <CloseIcon
            width={13}
            height={13}
            strokeWidth={String(getHeaderIconStrokeWidth(14.121, 13))}
            color={theme.primaryText}
          />
        ),
        label: t('Close')
      }
    }
    return {
      icon: (
        <LeftArrowIcon
          width={8}
          height={14}
          strokeWidth={getHeaderIconStrokeWidth(14.879, 14)}
          color={theme.primaryText}
        />
      ),
      label: t('Back')
    }
  }
  const { icon, label } = getContent()

  return (
    <HoverablePressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
    >
      <View style={disabled && DISABLED_STYLE}>
        <HeaderButtonSurface>{icon}</HeaderButtonSurface>
      </View>
    </HoverablePressable>
  )
}

export default React.memo(HeaderButton)

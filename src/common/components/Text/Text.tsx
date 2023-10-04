import React from 'react'
import { StyleSheet, Text as RNText, TextProps, TextStyle } from 'react-native'

import { FONT_FAMILIES } from '@common/hooks/useFonts'
import useTheme from '@common/hooks/useTheme'
import colors from '@common/styles/colors'

import styles, { TEXT_SCALE } from './styles'

type TextTypes = 'regular' | 'small' | 'caption' | 'info'
type TextWeight = 'light' | 'regular' | 'medium' | 'semiBold'
type TextAppearance = 'accent' | 'danger' | 'warning'

export interface Props extends TextProps {
  underline?: boolean
  type?: TextTypes
  weight?: TextWeight
  appearance?: TextAppearance
  fontSize?: number
  color?: string
  shouldScale?: boolean
}

const textStyles: { [key in TextTypes]: TextStyle } = {
  regular: styles.textRegular,
  small: styles.textSmall,
  caption: styles.textCaption,
  info: styles.textInfo
}

const textWeights: { [key in TextWeight]: string } = {
  light: FONT_FAMILIES.LIGHT,
  regular: FONT_FAMILIES.REGULAR,
  medium: FONT_FAMILIES.MEDIUM,
  semiBold: FONT_FAMILIES.SEMI_BOLD
}

const textAppearances: { [key in TextAppearance]: string } = {
  accent: colors.turquoise,
  danger: colors.pink,
  warning: colors.mustard
}

const Text: React.FC<Props> = ({
  type = 'regular',
  weight = 'light',
  appearance,
  children,
  underline,
  fontSize: _fontSize,
  color,
  style = {},
  shouldScale = true,
  ...rest
}) => {
  const fontSize = _fontSize ? (shouldScale ? _fontSize + TEXT_SCALE : _fontSize) : _fontSize
  const { theme } = useTheme()

  return (
    <RNText
      style={StyleSheet.flatten([
        { color: theme.primaryText },
        textStyles[type],
        { fontFamily: textWeights[weight] },
        !!underline && styles.underline,
        !!fontSize && {
          fontSize,
          // In case there is a custom `fontSize` passed, reset the `lineHeight`,
          // otherwise, one must also provide a different lineHeight than
          // the default one when using a custom `fontSize`.
          lineHeight: undefined
        },
        !!appearance && { color: textAppearances[appearance] },
        !!color && { color },
        style
      ])}
      {...rest}
    >
      {children}
    </RNText>
  )
}
export default Text

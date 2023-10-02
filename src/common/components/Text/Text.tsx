import React from 'react'
import { ColorValue, StyleSheet, Text as RNText, TextProps, TextStyle } from 'react-native'

import { FONT_FAMILIES } from '@common/hooks/useFonts'
import useTheme from '@common/hooks/useTheme'

import styles, { TEXT_SCALE } from './styles'

type TextTypes = 'regular' | 'small' | 'caption' | 'info'
type TextWeight = 'light' | 'regular' | 'medium' | 'semiBold'
type TextAppearance =
  | 'primary'
  | 'primaryText'
  | 'secondaryText'
  | 'accent1'
  | 'accent2'
  | 'accent3'

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

const Text: React.FC<Props> = ({
  type = 'regular',
  weight = 'light',
  appearance = 'primaryText',
  children,
  underline,
  fontSize: _fontSize,
  color,
  style = {},
  shouldScale = false,
  ...rest
}) => {
  const fontSize = _fontSize ? (shouldScale ? _fontSize + TEXT_SCALE : _fontSize) : _fontSize
  const { theme } = useTheme()

  const textAppearances: { [key in TextAppearance]: ColorValue } = {
    primary: theme.primary,
    primaryText: theme.primaryText,
    secondaryText: theme.secondaryText,
    accent1: theme.accent1,
    accent2: theme.accent2,
    accent3: theme.accent3
  }

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

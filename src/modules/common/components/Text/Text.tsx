import React from 'react'
import { StyleSheet, Text as RNText, TextProps, TextStyle } from 'react-native'

import { colorPalette as colors } from '@modules/common/styles/colors'

import styles from './styles'

type TextTypes = 'regular' | 'small' | 'caption' | 'info'
type TextAppearance = 'accent' | 'danger' | 'warning'

export interface Props extends TextProps {
  underline?: boolean
  type?: TextTypes
  appearance?: TextAppearance
  fontSize?: number
  color?: string
}

const textStyles: { [key in TextTypes]: TextStyle } = {
  regular: styles.textRegular,
  small: styles.textSmall,
  caption: styles.textCaption,
  info: styles.textInfo
}

const textAppearances: { [key in TextAppearance]: string } = {
  accent: colors.turquoise,
  danger: colors.pink,
  warning: colors.mustard
}

const Text: React.FC<Props> = ({
  type = 'regular',
  appearance,
  children,
  underline,
  fontSize,
  color,
  style = {},
  ...rest
}) => (
  <RNText
    style={StyleSheet.flatten([
      styles.text,
      textStyles[type],
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

export default Text

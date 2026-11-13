import React, { useContext } from 'react'
import { ColorValue, StyleSheet, Text as RNText, TextProps, TextStyle } from 'react-native'

import { isAndroid } from '@common/config/env'
import {
  FONT_FAMILIES,
  GEIST_MONO_FONT_FAMILIES,
  ROBOTO_FONT_FAMILIES
} from '@common/hooks/useFonts'
import useTheme from '@common/hooks/useTheme'
import { SheetHeaderTitleContext } from '@common/components/BottomSheet/SheetHeaderRow/SheetHeaderTitleContext'

import styles, { TEXT_SCALE } from './styles'

type TextTypes = 'regular' | 'small' | 'caption' | 'info'
export type TextWeight =
  | 'light'
  | 'regular'
  | 'medium'
  | 'semiBold'
  | 'number_light'
  | 'number_regular'
  | 'number_medium'
  | 'number_bold'
  | 'number_black'
  | 'mono_regular'
export type TextAppearance =
  | 'primary'
  | 'primaryText'
  | 'secondaryText'
  | 'tertiaryText'
  | 'successText'
  | 'warningText'
  | 'errorText'
  | 'infoText'
  | 'linkText'

export interface Props extends TextProps {
  underline?: boolean
  type?: TextTypes
  weight?: TextWeight
  appearance?: TextAppearance
  fontSize?: number
  color?: ColorValue | false
  shouldScale?: boolean
  dataSet?: { [key: string]: string }
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
  semiBold: FONT_FAMILIES.SEMI_BOLD,
  number_light: ROBOTO_FONT_FAMILIES.LIGHT,
  number_regular: ROBOTO_FONT_FAMILIES.REGULAR,
  number_medium: ROBOTO_FONT_FAMILIES.MEDIUM,
  number_bold: ROBOTO_FONT_FAMILIES.BOLD,
  number_black: ROBOTO_FONT_FAMILIES.BLACK,
  mono_regular: GEIST_MONO_FONT_FAMILIES.REGULAR
}

const LEFT_ALIGN_STYLE: TextStyle = { textAlign: 'left' }

const Text: React.FC<Props> = ({
  type = 'regular',
  weight = 'regular',
  appearance = 'primaryText',
  children,
  underline,
  fontSize: _fontSize,
  color,
  style = {},
  shouldScale = false,
  numberOfLines,
  onTextLayout,
  ...rest
}) => {
  const fontSize = _fontSize ? (shouldScale ? _fontSize + TEXT_SCALE : _fontSize) : _fontSize
  const { theme } = useTheme()

  // Every appearance names the theme colour it uses, so the colour is read straight off
  // the theme. Building a map of all nine of them to read one, on every render of every
  // one of the hundreds of texts a screen holds, is what this replaces.
  const appearanceColor: ColorValue = theme[appearance]
  // In the title of a native sheet's header: it wraps instead of being cut, and reports its
  // lines, so the row can move a long title left and line the buttons up with the first one
  const sheetHeaderTitle = useContext(SheetHeaderTitleContext)
  const handleTextLayout: TextProps['onTextLayout'] = sheetHeaderTitle
    ? (e) => {
        const { lines } = e.nativeEvent
        sheetHeaderTitle.reportLines(lines.length, lines[0]?.height ?? 0)
        onTextLayout?.(e)
      }
    : onTextLayout

  return (
    <RNText
      style={StyleSheet.flatten([
        { color: theme.primaryText },
        textStyles[type],
        {
          fontFamily: textWeights[weight],
          ...(isAndroid ? { includeFontPadding: false } : {})
        },
        !!underline && styles.underline,
        !!fontSize && {
          fontSize,
          // In case there is a custom `fontSize` passed, reset the `lineHeight`,
          // otherwise, one must also provide a different lineHeight than
          // the default one when using a custom `fontSize`.
          lineHeight: undefined
        },
        !!appearance && { color: appearanceColor },
        !!color && { color },
        style,
        sheetHeaderTitle?.align === 'left' && LEFT_ALIGN_STYLE
      ])}
      numberOfLines={sheetHeaderTitle ? undefined : numberOfLines}
      onTextLayout={handleTextLayout}
      {...rest}
    >
      {children}
    </RNText>
  )
}
export default React.memo(Text)

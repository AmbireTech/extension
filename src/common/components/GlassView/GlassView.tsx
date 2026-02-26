import { GlassView as ExpoGlassView } from 'expo-glass-effect'
import React, { FC } from 'react'
import { Platform, StyleSheet, View, ViewStyle } from 'react-native'

import useTheme from '@common/hooks/useTheme'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY, hexToRgba } from '@common/styles/utils/common'

import { GlassViewProps } from './types'

// Extracts React Native-compatible layout properties from a CSS style object
const extractRNStyleFromCSS = (cssStyle?: React.CSSProperties): ViewStyle | undefined => {
  if (!cssStyle) return undefined

  const rnStyle: ViewStyle = {}

  if (cssStyle.width !== undefined) rnStyle.width = cssStyle.width as number
  if (cssStyle.height !== undefined) rnStyle.height = cssStyle.height as number
  if (cssStyle.minWidth !== undefined) rnStyle.minWidth = cssStyle.minWidth as number
  if (cssStyle.minHeight !== undefined) rnStyle.minHeight = cssStyle.minHeight as number
  if (cssStyle.maxWidth !== undefined) rnStyle.maxWidth = cssStyle.maxWidth as number
  if (cssStyle.maxHeight !== undefined) rnStyle.maxHeight = cssStyle.maxHeight as number
  if (cssStyle.margin !== undefined) rnStyle.margin = cssStyle.margin as number
  if (cssStyle.marginTop !== undefined) rnStyle.marginTop = cssStyle.marginTop as number
  if (cssStyle.marginBottom !== undefined) rnStyle.marginBottom = cssStyle.marginBottom as number
  if (cssStyle.marginLeft !== undefined) rnStyle.marginLeft = cssStyle.marginLeft as number
  if (cssStyle.marginRight !== undefined) rnStyle.marginRight = cssStyle.marginRight as number
  if (cssStyle.padding !== undefined) rnStyle.padding = cssStyle.padding as number
  if (cssStyle.paddingTop !== undefined) rnStyle.paddingTop = cssStyle.paddingTop as number
  if (cssStyle.paddingBottom !== undefined) rnStyle.paddingBottom = cssStyle.paddingBottom as number
  if (cssStyle.paddingLeft !== undefined) rnStyle.paddingLeft = cssStyle.paddingLeft as number
  if (cssStyle.paddingRight !== undefined) rnStyle.paddingRight = cssStyle.paddingRight as number
  if (cssStyle.borderRadius !== undefined) rnStyle.borderRadius = cssStyle.borderRadius as number
  if (cssStyle.overflow !== undefined) rnStyle.overflow = cssStyle.overflow as 'hidden' | 'visible'
  if (cssStyle.opacity !== undefined) rnStyle.opacity = cssStyle.opacity as number

  return Object.keys(rnStyle).length > 0 ? rnStyle : undefined
}

const GlassView: FC<GlassViewProps> = ({
  children,
  style,
  cssStyle,
  testID,
  tintColor1,
  borderRadius = BORDER_RADIUS_PRIMARY,
  tintColor2,
  shineColor
}) => {
  const { themeType } = useTheme()

  const defaultTint1 = tintColor1 || hexToRgba('#D1D1D1', 0.16)
  const defaultTint2 = tintColor2 || hexToRgba('#D1D1D1', 0.06)
  const defaultShine =
    shineColor || (themeType === THEME_TYPES.LIGHT ? '#fff' : hexToRgba('#FFFFFF', 0.2))

  const cssExtracted = extractRNStyleFromCSS(cssStyle)

  // On Android, BlurView has historically had performance issues or didn't work at all on older versions.
  // We use a semi-transparent solid background to simulate the glass effect.
  if (Platform.OS === 'android') {
    return (
      <View
        testID={testID}
        style={[
          styles.container,
          {
            backgroundColor: defaultTint1,
            borderColor: defaultShine,
            borderRadius,
            borderWidth: 1
          },
          style,
          cssExtracted
        ]}
      >
        {children}
      </View>
    )
  }

  // iOS uses expo-glass-effect which wraps the native visual effect view
  return (
    <View testID={testID} style={[styles.container, { borderRadius }, style, cssExtracted]}>
      <ExpoGlassView
        glassEffectStyle="regular"
        colorScheme={themeType === THEME_TYPES.LIGHT ? 'light' : 'dark'}
        tintColor={defaultTint1}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden'
  }
})

export default GlassView

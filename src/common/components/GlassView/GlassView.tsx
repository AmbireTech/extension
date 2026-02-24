import { GlassView as ExpoGlassView } from 'expo-glass-effect'
import React, { FC } from 'react'
import { Platform, StyleSheet, View, ViewStyle } from 'react-native'

import useTheme from '@common/hooks/useTheme'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { hexToRgba } from '@common/styles/utils/common'

import { GlassViewProps } from './types'

const GlassView: FC<GlassViewProps> = ({
  children,
  style,
  cssStyle, // From web compatibility
  testID,
  tintColor1,
  tintColor2,
  shineColor,
  blurAmount = 4
}) => {
  const { themeType } = useTheme()

  // Convert web cssStyle to React Native style if passed (some props overlap like borderRadius)
  const compatibleStyle = (cssStyle as ViewStyle) || {}

  const defaultTint1 = tintColor1 || hexToRgba('#D1D1D1', 0.16)
  const defaultTint2 = tintColor2 || hexToRgba('#D1D1D1', 0.06)
  const defaultShine =
    shineColor || (themeType === THEME_TYPES.LIGHT ? '#fff' : hexToRgba('#FFFFFF', 0.2))

  // On Android, BlurView has historically had performance issues or didn't work at all on older versions.
  // We use a semi-transparent solid background to simulate the glass effect.
  if (Platform.OS === 'android') {
    return (
      <View
        testID={testID}
        style={[
          styles.container,
          { backgroundColor: defaultTint1, borderColor: defaultShine, borderWidth: 1 },
          style,
          compatibleStyle
        ]}
      >
        {children}
      </View>
    )
  }

  // iOS uses expo-glass-effect which wraps the native visual effect view
  return (
    <View testID={testID} style={[styles.container, style, compatibleStyle]}>
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

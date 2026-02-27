import { GlassView as ExpoGlassView } from 'expo-glass-effect'
import React, { FC } from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'

import useTheme from '@common/hooks/useTheme'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY, hexToRgba } from '@common/styles/utils/common'

import { GlassViewProps } from './types'

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
  const { pointerEvents, ...restCssStyle } = (cssStyle || {}) as any
  const mappedPointerEvents = pointerEvents === 'all' ? 'auto' : pointerEvents

  // iOS uses expo-glass-effect which wraps the native visual effect view
  return (
    <View
      testID={testID}
      pointerEvents={mappedPointerEvents}
      style={[styles.container, { borderRadius }, style, restCssStyle as ViewStyle]}
    >
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

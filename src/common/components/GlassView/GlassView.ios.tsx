import { GlassView as ExpoGlassView, isLiquidGlassAvailable } from 'expo-glass-effect'
import { LinearGradient } from 'expo-linear-gradient'
import React, { FC } from 'react'
import { StyleSheet, ViewStyle } from 'react-native'

import useTheme from '@common/hooks/useTheme'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY, hexToRgba } from '@common/styles/utils/common'

import { GlassViewProps } from './GlassView'

// `expo-glass-effect` only renders a visible glass effect on devices that
// support the native Liquid Glass API (iOS 26+). On older iOS devices the
// native view renders nothing, leaving the glass view invisible. This is a
// runtime constant, so it's safe to evaluate once at module load.
const liquidGlassAvailable = isLiquidGlassAvailable()

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

  const { pointerEvents, ...restCssStyle } = (cssStyle || {}) as any
  const mappedPointerEvents = pointerEvents === 'all' ? 'auto' : pointerEvents

  // Fallback for old iOS devices without Liquid Glass support: render the same
  // LinearGradient-based glass effect Android uses, so the view stays visible.
  if (!liquidGlassAvailable) {
    const defaultTint1 = tintColor1 || hexToRgba('#96A1B1', 0.18)
    const defaultTint2 = tintColor2 || hexToRgba('#96A1B1', 0.08)
    const defaultShine = shineColor || (themeType === THEME_TYPES.LIGHT ? '#ffffff' : '#96A1B1')

    return (
      <LinearGradient
        testID={testID}
        pointerEvents={mappedPointerEvents}
        colors={[defaultTint1, defaultTint2]}
        locations={[0, 0.5]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.container,
          {
            borderColor: defaultShine,
            borderRadius,
            borderWidth: 1
          },
          style,
          restCssStyle as ViewStyle
        ]}
      >
        {children}
      </LinearGradient>
    )
  }

  const defaultTint1 = tintColor1 || hexToRgba('#D1D1D1', 0.16)

  // iOS uses expo-glass-effect which wraps the native visual effect view
  return (
    <ExpoGlassView
      testID={testID}
      glassEffectStyle="clear"
      colorScheme="auto"
      tintColor={defaultTint1}
      style={[styles.container, { borderRadius }, style, restCssStyle as ViewStyle]}
      pointerEvents={mappedPointerEvents}
    >
      {children}
    </ExpoGlassView>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden'
  }
})

export default GlassView

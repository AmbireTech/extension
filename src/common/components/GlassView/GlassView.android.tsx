import { LinearGradient } from 'expo-linear-gradient'
import React, { FC } from 'react'
import { StyleSheet, ViewStyle } from 'react-native'

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

  const defaultTint1 = tintColor1 || hexToRgba('#96A1B1', 0.16)
  const defaultTint2 = tintColor2 || hexToRgba('#96A1B1', 0.06)
  const defaultShine = shineColor || (themeType === THEME_TYPES.LIGHT ? '#ffffff' : '#96A1B1')

  const { pointerEvents, ...restCssStyle } = (cssStyle || {}) as any
  const mappedPointerEvents = pointerEvents === 'all' ? 'auto' : pointerEvents

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

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden'
  }
})

export default GlassView

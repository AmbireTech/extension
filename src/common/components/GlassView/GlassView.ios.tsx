import { GlassView as ExpoGlassView } from 'expo-glass-effect'
import React, { FC } from 'react'
import { StyleSheet, ViewStyle } from 'react-native'

import { BORDER_RADIUS_PRIMARY, hexToRgba } from '@common/styles/utils/common'

import { GlassViewProps } from './GlassView'

const GlassView: FC<GlassViewProps> = ({
  children,
  style,
  cssStyle,
  testID,
  tintColor1,
  borderRadius = BORDER_RADIUS_PRIMARY
}) => {
  const defaultTint1 = tintColor1 || hexToRgba('#D1D1D1', 0.16)
  const { pointerEvents, ...restCssStyle } = (cssStyle || {}) as any
  const mappedPointerEvents = pointerEvents === 'all' ? 'auto' : pointerEvents

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

import React from 'react'
import { ViewStyle } from 'react-native'

type GlassViewProps = {
  children: React.ReactNode
  testID?: string
  cssStyle?: React.CSSProperties
  style?: ViewStyle
  tintColor1?: string
  tintColor2?: string
  shineColor?: string
  blurAmount?: number
  borderRadius?: number
}

export type { GlassViewProps }

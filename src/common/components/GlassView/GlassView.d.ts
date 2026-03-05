import React from 'react'
import { ViewStyle } from 'react-native'

export type GlassViewProps = {
  children: React.ReactNode
  testID?: string
  cssStyle?: React.CSSProperties
  style?: ViewStyle
  tintColor1?: string
  tintColor2?: string
  shineColor?: string
  blurAmount?: number
  borderRadius?: number
  /**
   * SVG filters produce a much better effect but have a tendency to cause
   * visual glitches when rendered above optimized images. Setting this to true will
   * fallback to a css blur which is less visually impressive but more stable.
   */
  isSimpleBlur?: boolean
}

declare const GlassView: React.FC<GlassViewProps>
export default GlassView

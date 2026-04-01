import { LottieComponentProps } from 'lottie-react'
import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'

export type LottieViewProps = {
  animationData: any
  autoPlay?: boolean
  loop?: boolean | number
  style?: StyleProp<ViewStyle> | LottieComponentProps['style'] | any
} & Omit<LottieComponentProps, 'animationData' | 'autoPlay' | 'loop' | 'style'>

declare const LottieView: React.ForwardRefExoticComponent<
  LottieViewProps & React.RefAttributes<any>
>

export default LottieView

import './styles.css'

import React from 'react'

import LottieView, { LottieViewProps } from '@common/components/LottieView'

import alternativeAnimation from './alternativeAnimation.json'
import animation from './animation.json'
import animationTertiary from './animationTertiary.json'

const animationMap = {
  primary: animation,
  secondary: alternativeAnimation,
  tertiary: animationTertiary
}

const preserveAspectRatioByResizeMode = {
  contain: 'xMidYMid meet',
  cover: 'xMidYMid slice',
  stretch: 'none'
} as const

type ConfettiAnimationProps = {
  width: number
  height: number
  style?: React.CSSProperties
  type?: 'primary' | 'secondary' | 'tertiary'
  /** How the Lottie canvas fills width/height. Default keeps the original centered look. */
  resizeMode?: keyof typeof preserveAspectRatioByResizeMode
} & Omit<LottieViewProps, 'animationData'>

const ConfettiAnimation = ({
  width,
  height,
  style = {},
  type = 'primary',
  resizeMode = 'contain',
  rendererSettings,
  ...rest
}: ConfettiAnimationProps) => {
  return (
    <LottieView
      {...rest}
      animationData={animationMap[type]}
      rendererSettings={{
        preserveAspectRatio: preserveAspectRatioByResizeMode[resizeMode],
        ...rendererSettings
      }}
      style={{
        width,
        height,
        position: 'absolute',
        pointerEvents: 'none',
        ...(resizeMode === 'contain' ? { alignSelf: 'center' } : { top: 0, left: 0 }),
        ...style
      }}
      autoPlay
    />
  )
}

export default React.memo(ConfettiAnimation)

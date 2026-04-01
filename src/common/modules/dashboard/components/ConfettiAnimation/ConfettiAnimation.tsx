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

type ConfettiAnimationProps = {
  width: number
  height: number
  style?: React.CSSProperties
  type?: 'primary' | 'secondary' | 'tertiary'
} & Omit<LottieViewProps, 'animationData'>

const ConfettiAnimation = ({
  width,
  height,
  style = {},
  type = 'primary',
  ...rest
}: ConfettiAnimationProps) => {
  return (
    <LottieView
      {...rest}
      animationData={animationMap[type]}
      style={{
        width,
        height,
        position: 'absolute',
        pointerEvents: 'none',
        alignSelf: 'center',
        ...style
      }}
      autoPlay
    />
  )
}

export default React.memo(ConfettiAnimation)

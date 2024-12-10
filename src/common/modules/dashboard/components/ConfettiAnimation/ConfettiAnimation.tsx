import './styles.css'

import LottieView, { LottieComponentProps } from 'lottie-react'
import React from 'react'

import alternativeAnimation from './alternativeAnimation.json'
import animation from './animation.json'

const ConfettiAnimation = ({
  width,
  height,
  type = 'primary',
  ...rest
}: { width: number; height: number; type?: 'primary' | 'secondary' } & Omit<
  LottieComponentProps,
  'animationData'
>) => {
  return (
    <LottieView
      {...rest}
      animationData={type === 'primary' ? animation : alternativeAnimation}
      style={{ width, height, position: 'absolute', pointerEvents: 'none', alignSelf: 'center' }}
      loop={false}
    />
  )
}

export default React.memo(ConfettiAnimation)

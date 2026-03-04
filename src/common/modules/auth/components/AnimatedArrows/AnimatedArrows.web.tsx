import React from 'react'

import LottieView from '@common/components/LottieView'

import animation from './animated-arrows.json'

const AnimatedArrows = () => {
  return (
    <LottieView
      animationData={animation}
      style={{
        width: 45,
        height: 45,
        transform: 'rotate(-90deg)'
      }}
      autoPlay
      loop
    />
  )
}

export default AnimatedArrows

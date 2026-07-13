import React from 'react'

import LottieView from '@common/components/LottieView'

import animation from './dots-loading-animation.json'

const DotsLoadingAnimation = () => {
  return (
    <LottieView
      animationData={animation}
      autoPlay
      loop
      style={{
        width: 64,
        height: 38
      }}
    />
  )
}

export default React.memo(DotsLoadingAnimation)

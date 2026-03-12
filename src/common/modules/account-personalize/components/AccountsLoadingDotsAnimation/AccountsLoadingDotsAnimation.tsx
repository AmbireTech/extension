import React from 'react'

import LottieView from '@common/components/LottieView'

import animation from './accounts-loading-dots-animation.json'

const AccountsLoadingDotsAnimation = () => {
  return (
    <LottieView
      animationData={animation}
      autoPlay
      loop
      style={{
        width: 64,
        height: 38,
        backgroundColor: 'transparent'
      }}
    />
  )
}

export default React.memo(AccountsLoadingDotsAnimation)

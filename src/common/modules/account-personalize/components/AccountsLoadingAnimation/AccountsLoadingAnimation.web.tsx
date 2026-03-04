import LottieView from 'lottie-react'
import React from 'react'

import animation from './accounts-loading-animation.json'

const AccountsLoadingAnimation = () => {
  return (
    <LottieView
      animationData={animation}
      style={{ width: 208, height: 156, alignSelf: 'center' }}
      autoPlay
      loop
    />
  )
}

export default React.memo(AccountsLoadingAnimation)

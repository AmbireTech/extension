import React from 'react'

import LottieView from '@common/components/LottieView'

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

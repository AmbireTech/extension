import LottieView from 'lottie-react'
import React from 'react'

import animation from './accounts-loading-dots-animation.json'

const AccountsLoadingDotsAnimation = () => {
  return <LottieView animationData={animation} style={{ width: 30, height: 12 }} autoPlay loop />
}

export default React.memo(AccountsLoadingDotsAnimation)

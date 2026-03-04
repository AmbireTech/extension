import LottieView from 'lottie-react-native'
import React from 'react'
import { ViewStyle } from 'react-native'

import animation from './accounts-loading-animation.json'

const AccountsLoadingAnimation = () => {
  return (
    <LottieView
      source={animation}
      style={{ width: 208, height: 156, alignSelf: 'center' } as ViewStyle}
      autoPlay
      loop
    />
  )
}

export default React.memo(AccountsLoadingAnimation)

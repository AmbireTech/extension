import LottieView from 'lottie-react-native'
import React from 'react'
import { ViewStyle } from 'react-native'

import animation from './accounts-loading-dots-animation.json'

const AccountsLoadingDotsAnimation = () => {
  return (
    <LottieView source={animation} style={{ width: 30, height: 12 } as ViewStyle} autoPlay loop />
  )
}

export default React.memo(AccountsLoadingDotsAnimation)

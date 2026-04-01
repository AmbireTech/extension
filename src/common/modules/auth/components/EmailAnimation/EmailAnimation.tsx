import React from 'react'
import { ViewStyle } from 'react-native'

import LottieView from '@common/components/LottieView'

import animation from './email-animation.json'

const EmailAnimation = ({
  width = 139,
  height = 139,
  style
}: {
  width?: number
  height?: number
  style?: ViewStyle
}) => {
  return (
    <LottieView
      animationData={animation}
      style={{ width, height, alignSelf: 'center', ...(style || {}) } as any}
      autoPlay
      loop
    />
  )
}

export default React.memo(EmailAnimation)

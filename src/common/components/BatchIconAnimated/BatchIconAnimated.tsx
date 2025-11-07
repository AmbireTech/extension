import './styles.css'

import LottieView, { LottieComponentProps } from 'lottie-react'
import React from 'react'
import { View } from 'react-native'

import flexbox from '@common/styles/utils/flexbox'
import confettiAnimation from './confetti-animation.json'
import iconAnimation from './icon-animation.json'

type ConfettiAnimationProps = {
  width?: number
  height?: number
} & Omit<LottieComponentProps, 'animationData'>

const BatchIconAnimated = ({ width = 180, height = 160 }: ConfettiAnimationProps) => {
  return (
    <View style={[flexbox.alignCenter, flexbox.justifyCenter, { width, height }]}>
      <LottieView
        animationData={confettiAnimation}
        style={{
          position: 'absolute',
          pointerEvents: 'none'
        }}
      />
      <LottieView
        animationData={iconAnimation}
        style={{
          position: 'absolute',
          pointerEvents: 'none',
          width: width * 0.8
        }}
      />
    </View>
  )
}

export default React.memo(BatchIconAnimated)

import LottieViewNative from 'lottie-react-native'
import React, { forwardRef } from 'react'

import { LottieViewProps } from './LottieView'

const LottieView = forwardRef<LottieViewNative, LottieViewProps>(
  ({ animationData, autoPlay, loop, style, ...rest }, ref) => {
    return (
      <LottieViewNative
        ref={ref}
        source={animationData}
        autoPlay={autoPlay}
        loop={loop as boolean}
        style={style as any}
        {...rest}
      />
    )
  }
)

export default LottieView

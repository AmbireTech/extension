import React from 'react'

import LottieView, { LottieViewProps } from '@common/components/LottieView'

import iconAnimation from './icon-animated.json'

type Props = {
  height?: number
} & Omit<LottieViewProps, 'animationData'>

const ASPECT_RATIO = 1280 / 720

const BatchIconAnimated = ({ height = 84 }: Props) => {
  return (
    <LottieView
      animationData={iconAnimation}
      style={{
        width: height * ASPECT_RATIO,
        height: height
      }}
    />
  )
}

export default React.memo(BatchIconAnimated)

import React, { useMemo } from 'react'

import LottieView from '@common/components/LottieView'

import SpinnerAnimation from './spinner-animation.json'
import BlackSpinnerAnimation from './spinner-black-animation.json'
import InfoSpinnerAnimation from './spinner-info-animation.json'
import WhiteSpinnerAnimation from './spinner-white-animation.json'

const Spinner = ({
  style,
  variant = 'gradient'
}: {
  style?: any
  variant?: 'gradient' | 'white' | 'info' | 'black'
}) => {
  const animation = useMemo(() => {
    if (variant === 'white') return WhiteSpinnerAnimation
    if (variant === 'black') return BlackSpinnerAnimation
    if (variant === 'info') return InfoSpinnerAnimation

    return SpinnerAnimation
  }, [variant])

  return (
    <LottieView
      animationData={animation}
      style={{ width: 40, height: 40, ...style }}
      autoPlay
      loop
    />
  )
}

export default React.memo(Spinner)

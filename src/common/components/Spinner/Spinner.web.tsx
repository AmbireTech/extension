import LottieView from 'lottie-react'
import React, { useMemo } from 'react'

import SpinnerAnimation from './spinner-animation.json'
import BlackSpinnerAnimation from './spinner-black-animation.json'
import Info2SpinnerAnimation from './spinner-info2-animation.json'
import WhiteSpinnerAnimation from './spinner-white-animation.json'

const Spinner = ({
  style,
  variant = 'gradient'
}: {
  style: any
  variant?: 'gradient' | 'white' | 'info2' | 'black'
}) => {
  const animation = useMemo(() => {
    if (variant === 'white') return WhiteSpinnerAnimation
    if (variant === 'black') return BlackSpinnerAnimation
    if (variant === 'info2') return Info2SpinnerAnimation

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

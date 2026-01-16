import LottieView from 'lottie-react-native'
import React, { useMemo } from 'react'
import { ViewStyle } from 'react-native'

import SpinnerAnimation from './spinner-animation.json'
import BlackSpinnerAnimation from './spinner-black-animation.json'
import Info2SpinnerAnimation from './spinner-info2-animation.json'
import WhiteSpinnerAnimation from './spinner-white-animation.json'
import styles from './styles'

const Spinner = ({
  style,
  variant
}: {
  style?: ViewStyle
  variant?: 'gradient' | 'white' | 'info2' | 'black'
}) => {
  const animation = useMemo(() => {
    if (variant === 'gradient') return SpinnerAnimation
    if (variant === 'white') return WhiteSpinnerAnimation
    if (variant === 'black') return BlackSpinnerAnimation
    if (variant === 'info2') return Info2SpinnerAnimation

    return SpinnerAnimation
  }, [variant])

  return <LottieView source={animation} style={(styles.spinner, style)} autoPlay loop />
}

export default Spinner

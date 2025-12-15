import LottieView from 'lottie-react-native'
import React from 'react'
import { ViewStyle } from 'react-native'

import SpinnerAnimation from './spinner-animation.json'
import WhiteSpinnerAnimation from './spinner-white-animation.json'
import styles from './styles'

const Spinner = ({
  style,
  variant
}: {
  style?: ViewStyle
  variant?: 'gradient' | 'white' | 'info2' | 'black'
}) => {
  return (
    <LottieView
      source={variant === 'gradient' ? SpinnerAnimation : WhiteSpinnerAnimation}
      style={(styles.spinner, style)}
      autoPlay
      loop
    />
  )
}

export default Spinner

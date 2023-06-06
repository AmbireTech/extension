import LottieView from 'lottie-react-native'
import React from 'react'
import { ViewStyle } from 'react-native'

import SpinnerAnimation from './spinner-animation.json'
import styles from './styles'

const Spinner = ({ style }: { style: ViewStyle }) => {
  return <LottieView source={SpinnerAnimation} style={(styles.spinner, style)} autoPlay loop />
}

export default Spinner

import React from 'react'

import LottieView from '@common/components/LottieView'

import animation from './animated-arrows.json'
import styles from './styles'

const AnimatedArrows = () => {
  return <LottieView animationData={animation} style={styles.lottie} autoPlay loop />
}

export default AnimatedArrows

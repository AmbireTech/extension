import LottieViewWeb from 'lottie-react'
import React, { forwardRef } from 'react'

import { LottieViewProps } from './LottieView'

const LottieView = forwardRef<any, LottieViewProps>((props, ref) => {
  return <LottieViewWeb lottieRef={ref} {...(props as any)} />
})

export default LottieView

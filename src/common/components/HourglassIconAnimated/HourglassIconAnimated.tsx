import React, { memo, useMemo } from 'react'

import LottieView from '@common/components/LottieView'
import useTheme from '@common/hooks/useTheme'
import { recolorLottie } from '@common/utils/recolorLottie'

import animationData from './hourglass-animation.json'

interface Props {
  width?: number
  height?: number
  color?: string
}

const HourglassIconAnimated: React.FC<Props> = ({ width = 24, height = 24, color }) => {
  const { theme } = useTheme()
  const tint = color || (theme.iconPrimary as string)
  const animation = useMemo(() => recolorLottie(animationData, tint), [tint])

  return <LottieView animationData={animation} autoPlay loop style={{ width, height }} />
}

export default memo(HourglassIconAnimated)

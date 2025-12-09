import React, { FC } from 'react'
import { Path, Svg } from 'react-native-svg'

import { LegendsSvgProps } from '@legends/types/svg'

const ChevronDownIcon: FC<LegendsSvgProps> = ({
  width = 24,
  height = 24,
  color = '#2F3346',
  ...rest
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path d="M7 9.5L12 14.5L17 9.5" stroke={color} strokeWidth="3" stroke-linecap="round" />
    </Svg>
  )
}

export default ChevronDownIcon

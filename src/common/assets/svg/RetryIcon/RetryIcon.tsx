import React, { FC, memo } from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

const RetryIcon: FC<SvgProps> = ({ width = 13.5, height = 15.63, color }) => {
  return (
    <Svg width={width} height={height}>
      <G fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
        <Path d="M4.749 2.885a6.734 6.734 0 0 1 2-.308 6.079 6.079 0 0 1 6 6.151 6.079 6.079 0 0 1-6 6.151 6.079 6.079 0 0 1-6-6.151 6.268 6.268 0 0 1 1.008-3.42" />
        <Path d="m3.999 2.967 1.66-1.91" />
        <Path d="m4.02 3.402 1.94 1.42" />
      </G>
    </Svg>
  )
}

export default memo(RetryIcon)

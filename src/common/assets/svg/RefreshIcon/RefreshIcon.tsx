import React, { FC } from 'react'
import { Path, Svg, SvgProps } from 'react-native-svg'

const RefreshIcon: FC<SvgProps> = ({ color = '#E3E6EB', width = 32, height = 32 }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 28 28" fill="none">
      <Path
        stroke={color}
        strokeLinecap="round"
        strokeWidth="1.5"
        d="m9.333 15.167-3.5-3.5-3.5 3.5"
      />
      <Path
        stroke={color}
        strokeLinecap="round"
        strokeWidth="1.5"
        d="M18.083 21.073a8.165 8.165 0 0 1-12.205-7.927M18.667 12.833l3.5 3.5 3.5-3.5"
      />
      <Path
        stroke={color}
        strokeLinecap="round"
        strokeWidth="1.5"
        d="M9.917 6.927a8.167 8.167 0 0 1 12.205 7.927"
      />
    </Svg>
  )
}

export default RefreshIcon

import React, { FC, memo } from 'react'
import { G, Path, Svg, SvgProps } from 'react-native-svg'

const SecurityIcon: FC<SvgProps> = ({ width, height, color = '#02aa5d' }) => {
  return (
    <Svg viewBox="0 0 51.191 64" width={width} height={height}>
      <G>
        <Path
          d="M51.191 35.2c0 16-11.2 24-24.508 28.635a3.2 3.2 0 0 1-2.143-.035C11.2 59.191 0 51.192 0 35.2V12.8a3.2 3.2 0 0 1 3.2-3.2c6.4 0 14.4-3.839 19.965-8.7a3.743 3.743 0 0 1 4.863 0c5.6 4.9 13.566 8.7 19.965 8.7a3.2 3.2 0 0 1 3.2 3.2Z"
          fill={color}
        />
        <Path
          d="m15.997 31.997 6.4 6.4 12.8-12.8"
          fill="none"
          stroke="#fff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />
      </G>
    </Svg>
  )
}

export default memo(SecurityIcon)

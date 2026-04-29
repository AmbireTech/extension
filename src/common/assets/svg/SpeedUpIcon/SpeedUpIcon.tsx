import React, { FC } from 'react'
import { Line, Path, Svg, SvgProps } from 'react-native-svg'

const RefreshIcon: FC<SvgProps> = ({
  color = '#E3E6EB',
  width = 32,
  height = 32,
  strokeWidth = 1.5,
  ...rest
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        d="M8 7.14286C9.19184 6.41735 10.5882 6 12.0811 6C16.4546 6 20 9.58172 20 14C20 18.4183 16.4546 22 12.0811 22C10.5882 22 9.19184 21.5827 8 20.8571"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path d="M12 14L12 11" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path
        d="M17.7582 7.83651L19.2418 6.16348"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M10.0681 2.37059C10.1821 2.26427 10.4332 2.17033 10.7825 2.10332C11.1318 2.03632 11.5597 2 12 2C12.4403 2 12.8682 2.03632 13.2175 2.10332C13.5668 2.17033 13.8179 2.26427 13.9319 2.37059"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Line
        x1="7.25"
        y1="10.75"
        x2="3.75"
        y2="10.75"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Line
        x1="7.25"
        y1="14.25"
        x2="1.75"
        y2="14.25"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Line
        x1="7.25"
        y1="17.75"
        x2="3.75"
        y2="17.75"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  )
}

export default RefreshIcon

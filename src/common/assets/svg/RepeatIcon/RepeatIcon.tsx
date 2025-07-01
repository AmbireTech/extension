import React from 'react'
import Svg, { G, Path, Rect, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const RepeatIcon: React.FC<SvgProps> = ({
  width = 20,
  height = 20,
  color,
  strokeWidth = '1.5',
  ...rest
}) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 20 20" {...rest}>
      <G transform="translate(-0.143 -0.143)">
        <Rect width="20" height="20" transform="translate(20.143 0.143) rotate(90)" fill="none" />
        <G transform="translate(1.876 3.381)">
          <Path
            d="M30.009,6v4.509H25.5"
            transform="translate(-13.476 -5.25)"
            fill="none"
            stroke={color || theme.primary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
          <Path
            d="M1.5,25.509V21H6.009"
            transform="translate(-1.5 -12.735)"
            fill="none"
            stroke={color || theme.primary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
          <Path
            d="M3.386,9.011a6.764,6.764,0,0,1,11.16-2.525l3.487,3.277M1.5,12.768l3.487,3.277a6.764,6.764,0,0,0,11.16-2.525"
            transform="translate(-1.5 -4.503)"
            fill="none"
            stroke={color || theme.primary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(RepeatIcon)

import React from 'react'
import Svg, { Circle, G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const ConnectedIcon: React.FC<SvgProps> = ({ width = 20, height = 20, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 20 20" {...rest}>
      <Circle cx="10" cy="10" r="10" fill="rgba(1,134,73,0.08)" opacity="0" />
      <G transform="translate(-2.166 -2.166)">
        <G transform="translate(9.88 4.166)">
          <Path
            d="M29.714,17.506,24,11.792l1.714-1.714a4.041,4.041,0,1,1,5.714,5.714Z"
            transform="translate(-24 -7.221)"
            fill="none"
            stroke={color || theme.successDecorative}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <Path
            d="M37,8.857,39.857,6"
            transform="translate(-29.572 -6)"
            fill="none"
            stroke={color || theme.successDecorative}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </G>
        <G transform="translate(4.167 8.738)">
          <Path
            d="M11.792,24l5.714,5.714-1.714,1.714a4.041,4.041,0,1,1-5.714-5.714Z"
            transform="translate(-7.221 -22.857)"
            fill="none"
            stroke={color || theme.successDecorative}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <Path
            d="M6,39.857,8.857,37"
            transform="translate(-6 -28.429)"
            fill="none"
            stroke={color || theme.successDecorative}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <Path
            d="M18.286,22,16,24.286"
            transform="translate(-10.286 -22)"
            fill="none"
            stroke={color || theme.successDecorative}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            opacity="0"
          />
          <Path
            d="M24.286,28,22,30.286"
            transform="translate(-12.858 -24.572)"
            fill="none"
            stroke={color || theme.successDecorative}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            opacity="0"
          />
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(ConnectedIcon)

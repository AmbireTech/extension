import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const LightModeIcon: React.FC<SvgProps> = ({ width = 18, height = 18, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 18 18" {...rest}>
      <G transform="translate(-604 -552)">
        <Path
          d="M10.7,15.9a5.2,5.2,0,1,0-5.2-5.2A5.2,5.2,0,0,0,10.7,15.9Z"
          transform="translate(602.299 550.3)"
          fill="none"
          stroke={color || theme.primary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <Path
          d="M15.713,15.712l-.1-.1m0-11.216.1-.1ZM4.289,15.712l.1-.1ZM10,2.064v0ZM10,18v0ZM2.065,10h0ZM18,10h0ZM4.393,4.392l-.1-.1Z"
          transform="translate(602.999 551)"
          fill="none"
          stroke={color || theme.primary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </G>
    </Svg>
  )
}

export default React.memo(LightModeIcon)

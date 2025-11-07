import React from 'react'
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg'

import { LegendsSvgProps } from '@legends/types/svg'

const EqualIcon: React.FC<LegendsSvgProps> = ({ width = 66, height = 67, color, ...rest }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 66 67" fill="none" {...rest}>
      <Path
        d="M24 30.1834V24H58V30.1834H24ZM24 43V36.8166H58V43H24Z"
        fill={color || 'url(#paint0_linear_5430_10905)'}
      />
      <Defs>
        <LinearGradient
          id="paint0_linear_5430_10905"
          x1="37.5"
          y1="16"
          x2="74.4372"
          y2="43.7491"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0.217948" stopColor="#00BB92" />
          <Stop offset="0.583333" stopColor="#1B709B" />
          <Stop offset="1" stopColor="#350586" />
        </LinearGradient>
      </Defs>
    </Svg>
  )
}

export default EqualIcon

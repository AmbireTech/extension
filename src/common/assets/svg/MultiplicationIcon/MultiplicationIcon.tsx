import React from 'react'
import { Defs, LinearGradient, Path, Stop, Svg } from 'react-native-svg'

import { LegendsSvgProps } from '@legends/types/svg'

const MultiplicationIcon: React.FC<LegendsSvgProps> = ({ width = 74, height = 66, ...rest }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 74 66" fill="none" {...rest}>
      <Path
        d="M24 45.02L36.1968 32.8232L24.4206 21.047L29.0469 16.4206L40.8232 28.1969L53.02 16.0001L57.8566 20.8367L45.6598 33.0335L57.436 44.8097L52.8097 49.4361L41.0335 37.6599L28.8367 49.8567L24 45.02Z"
        fill="url(#paint0_linear_5430_10924)"
      />
      <Defs>
        <LinearGradient
          id="paint0_linear_5430_10924"
          x1="17"
          y1="18.0001"
          x2="73.3744"
          y2="63.6709"
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

export default MultiplicationIcon

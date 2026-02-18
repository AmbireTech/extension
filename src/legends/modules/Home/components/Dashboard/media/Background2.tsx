import React from 'react'
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg'

import { LegendsSvgProps } from '@legends/types/svg'

const Background2 = (props: LegendsSvgProps) => {
  return (
    <Svg viewBox="0 0 292 188" fill="none" {...props}>
      <Path
        d="M284 2.39119e-05C288.418 2.65893e-05 292 3.58175 292 8.00002L292 179.716C292 184.134 288.418 187.716 284 187.716L175.101 187.716C168.051 187.716 162.16 182.339 156.412 178.256C153.473 176.167 149.88 174.939 146 174.939C142.12 174.939 138.527 176.167 135.588 178.256C129.84 182.339 123.949 187.716 116.899 187.716L7.99998 187.716C3.58171 187.716 -7.91438e-06 184.134 -1.63132e-05 179.716L-7.26178e-07 8C-3.25121e-07 3.58172 3.58172 3.0157e-07 8 6.73575e-07L284 2.39119e-05Z"
        fill="url(#paint0_linear_6209_8516)"
      />
      <Defs>
        <LinearGradient
          id="paint0_linear_6209_8516"
          x1="146"
          y1="3.90119e-06"
          x2="161.609"
          y2="186.409"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#191A1F" />
          <Stop offset="1" stopColor="#2B2D36" />
        </LinearGradient>
      </Defs>
    </Svg>
  )
}

export default Background2

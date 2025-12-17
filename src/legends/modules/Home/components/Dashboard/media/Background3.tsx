import React from 'react'
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg'

import { LegendsSvgProps } from '@legends/types/svg'

const Background3 = (props: LegendsSvgProps) => {
  return (
    <Svg viewBox="0 0 292 170" fill="none" {...props}>
      <Path
        d="M284 169.506C288.418 169.506 292 165.924 292 161.506L292 7.99998C292 3.58187 288.418 -2.42839e-05 284 -2.39119e-05L7.99998 -6.73575e-07C3.58183 -3.0158e-07 0.000174494 3.58188 -1.46603e-05 8L-7.26178e-07 161.506C3.65906e-06 165.924 3.58172 169.506 8 169.506L284 169.506Z"
        fill="url(#paint0_linear_6209_8520)"
      />
      <Defs>
        <LinearGradient
          id="paint0_linear_6209_8520"
          x1="146"
          y1="169.506"
          x2="158.744"
          y2="0.963651"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#2B2D36" />
          <Stop offset="1" stopColor="#191A1F" />
        </LinearGradient>
      </Defs>
    </Svg>
  )
}

export default Background3

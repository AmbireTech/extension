import React from 'react'
import Svg, { Defs, LinearGradient, Path, Stop, SvgProps } from 'react-native-svg'

const Background3 = (props: SvgProps) => {
  return (
    <Svg viewBox="0 0 124 98" fill="none" {...props}>
      <Path
        d="M115.048 0C119.466 0.000146957 123.048 3.58182 123.048 8V90C123.048 94.4181 119.466 97.9999 115.048 98H1C0.447797 98 0.000131965 97.5522 0 97V1C3.80054e-06 0.447719 0.447718 2.60474e-08 1 0H115.048Z"
        fill="url(#paint0_linear_985_7572)"
      />
      <Defs>
        <LinearGradient
          id="paint0_linear_985_7572"
          x1="0"
          y1="49"
          x2="129.654"
          y2="49"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#191A1F" />
          <Stop offset="0.508197" stopColor="#2B2D36" />
        </LinearGradient>
      </Defs>
    </Svg>
  )
}

export default Background3

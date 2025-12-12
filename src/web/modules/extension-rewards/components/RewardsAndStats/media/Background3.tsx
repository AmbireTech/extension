import React from 'react'
import Svg, { Defs, LinearGradient, Path, Stop, SvgProps } from 'react-native-svg'

const Background3 = (props: SvgProps) => {
  return (
    <Svg viewBox="0 0 152 98" fill="none" {...props}>
      <Path
        d="M144 0C148.418 2.17247e-06 152 3.58173 152 8V90C152 94.4182 148.418 98 144 98H1C0.447797 98 0.000131945 97.5522 0 97V1C3.79881e-06 0.447719 0.447718 2.36645e-08 1 0H144Z"
        fill="url(#paint0_linear_6176_1733)"
      />
      <Defs>
        <LinearGradient
          id="paint0_linear_6176_1733"
          x1="0"
          y1="49"
          x2="160.161"
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

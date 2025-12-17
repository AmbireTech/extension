import React from 'react'
import Svg, { Defs, LinearGradient, Path, Stop, SvgProps } from 'react-native-svg'

const Background2 = (props: SvgProps) => {
  return (
    <Svg viewBox="0 0 195 98" fill="none" {...props}>
      <Path
        d="M-3.93402e-06 8C-4.12715e-06 3.58173 3.58172 -1.56562e-07 8 -3.49691e-07L187 -8.17403e-06C191.418 -8.36716e-06 195 3.58171 195 7.99999L195 20.3652C195 28.6751 187.081 35.3004 183.032 42.5573C181.957 44.4858 181.349 46.6768 181.349 49C181.349 51.3232 181.957 53.5141 183.032 55.4426C187.081 62.6995 195 69.325 195 77.6348L195 90C195 94.4182 191.418 98 187 98L8 98C3.5818 98 0.000131592 94.4182 -3.49693e-07 90L-3.93402e-06 8Z"
        fill="url(#paint0_linear_6216_13954)"
      />
      <Defs>
        <LinearGradient
          id="paint0_linear_6216_13954"
          x1="12.4468"
          y1="49.2532"
          x2="100.869"
          y2="29.5049"
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

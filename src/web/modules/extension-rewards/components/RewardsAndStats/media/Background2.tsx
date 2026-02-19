import React from 'react'
import Svg, { Defs, LinearGradient, Path, Stop, SvgProps } from 'react-native-svg'

const Background2 = (props: SvgProps) => {
  return (
    <Svg viewBox="0 0 158 98" fill="none" {...props}>
      <Path
        d="M-3.18468e-06 8C-3.34103e-06 3.58173 3.58172 -1.934e-07 8 -4.31972e-07L149.857 -8.09177e-06C154.275 0.00023581 157.857 3.58186 157.857 7.99999L157.857 20.6543C157.857 28.8429 150.164 36.2546 147.595 44.0299C147.085 45.5744 146.806 47.2497 146.806 49C146.806 50.7503 147.085 52.4255 147.595 53.9699C150.164 61.7453 157.857 69.1571 157.857 77.3458L157.857 90C157.857 94.418 154.275 97.9997 149.857 98L8 98C3.5818 98 0.000131622 94.4182 -2.83083e-07 90L-3.18468e-06 8Z"
        fill="url(#paint0_linear_985_7569)"
      />
      <Defs>
        <LinearGradient
          id="paint0_linear_985_7569"
          x1="10.076"
          y1="49.2532"
          x2="82.8474"
          y2="36.096"
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

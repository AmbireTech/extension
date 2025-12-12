import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Background1 = (props: SvgProps) => {
  return (
    <Svg viewBox="0 0 157 98" fill="none" {...props}>
      <Path
        d="M-3.93402e-06 8C-4.12715e-06 3.58172 3.58172 -1.56562e-07 8 -3.49691e-07L149 -6.513e-06C153.418 1.61821e-05 157 3.58173 157 7.99999L157 20.4526C157 28.726 149.087 35.5804 145.566 43.067C144.719 44.8684 144.245 46.8791 144.245 49C144.245 51.1209 144.719 53.1315 145.566 54.9329C149.087 62.4195 157 69.274 157 77.5474L157 90C157 94.4181 153.418 98 149 98L8 98C3.5818 98 0.000131753 94.4182 -3.49693e-07 90L-3.93402e-06 8Z"
        fill="#2B2D36"
      />
    </Svg>
  )
}

export default Background1

import React from 'react'
import Svg, { Path } from 'react-native-svg'

import { LegendsSvgProps } from '@legends/types/svg'

const Background1 = (props: LegendsSvgProps) => {
  return (
    <Svg viewBox="0 0 292 163" fill="none" {...props}>
      <Path
        d="M284 2.48281e-05C288.418 2.75336e-05 292 3.58175 292 8.00003L292 155C292 159.418 288.418 163 284 163L173.538 163C167 163 161.429 158.356 155.994 154.721C153.135 152.808 149.698 151.693 146 151.693C142.302 151.693 138.865 152.808 136.007 154.721C130.572 158.356 125.001 163 118.463 163L7.99999 163C3.58171 163 -5.53911e-06 159.418 -1.35505e-05 155L-6.99382e-07 8C1.15053e-06 3.58172 3.58172 3.13124e-07 8 6.99382e-07L284 2.48281e-05Z"
        fill="#2B2D36"
      />
    </Svg>
  )
}

export default Background1

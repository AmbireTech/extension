import React from 'react'
import Svg, { Path } from 'react-native-svg'

import { LegendsSvgProps } from '@legends/types/svg'

const Ribbon: React.FC<LegendsSvgProps> = ({ width = 10, height = 13, ...rest }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 10 13" fill="none" {...rest}>
      <Path
        d="M7 0C10 0 10 1.01233 10 3.03698V10.1032C10 14.4864 8.59 12.8696 6.86 11.8272L5.54 11.0253C5.24 10.8449 4.76 10.8449 4.46 11.0253L3.14 11.8272C1.41 12.8696 1.91008e-09 14.4864 1.91008e-09 10.1032V3.03698C1.91008e-09 1.01233 -0.00162768 0 3 0H7Z"
        fill="#00BB92"
      />
    </Svg>
  )
}

export default Ribbon

import React from 'react'
import Svg, { Path } from 'react-native-svg'

import { LegendsSvgProps } from '@legends/types/svg'

const UnionIcon: React.FC<LegendsSvgProps> = ({ width = 7, height = 13 }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 7 13" fill="none">
      <Path
        d="M1.12891 0C1.75243 0 2.25771 0.505411 2.25781 1.12891V1.13086C2.33463 1.12978 2.41535 1.12891 2.5 1.12891H5.69141C7.67065 1.12891 6.9415 1.76574 6.4707 2.54688L6.1084 3.14355C6.02695 3.27901 6.02699 3.49536 6.1084 3.63086L6.4707 4.22754C6.94149 5.00872 7.67075 5.64551 5.69141 5.64551H2.5C2.41534 5.64551 2.33463 5.64365 2.25781 5.64258V11.291C2.25777 11.9146 1.75246 12.4199 1.12891 12.4199C0.505436 12.4198 3.98453e-05 11.9145 0 11.291V1.12891C0.000100977 0.505473 0.505473 0.000101576 1.12891 0Z"
        fill="#02F3BF"
      />
    </Svg>
  )
}

export default UnionIcon

import React from 'react'
import { ColorValue } from 'react-native'
import Svg, { Path, SvgProps } from 'react-native-svg'

import colors from '@common/styles/colors'

interface Props extends SvgProps {
  width?: number
  height?: number
  color?: ColorValue
}

const InvisibilityIcon: React.FC<Props> = ({ width = 24, height = 24, color = colors.titan }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24">
    <Path
      d="M12,6.5a4.938,4.938,0,0,1,4.76,6.46l3.06,3.06A11.8,11.8,0,0,0,23,11.49,11.838,11.838,0,0,0,8.36,4.57l2.17,2.17A5.14,5.14,0,0,1,12,6.5ZM2.71,3.16a1,1,0,0,0,0,1.41L4.68,6.54A11.892,11.892,0,0,0,1,11.5a11.8,11.8,0,0,0,15.31,6.68l2.72,2.72a1,1,0,0,0,1.41-1.41L4.13,3.16A1.008,1.008,0,0,0,2.71,3.16ZM12,16.5a5,5,0,0,1-5-5,4.911,4.911,0,0,1,.49-2.14l1.57,1.57A3.434,3.434,0,0,0,9,11.5a3,3,0,0,0,3,3,2.694,2.694,0,0,0,.57-.07L14.14,16A4.813,4.813,0,0,1,12,16.5Zm2.97-5.33a2.969,2.969,0,0,0-2.64-2.64Z"
      fill={color}
    />
  </Svg>
)

export default InvisibilityIcon

import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import colors from '@common/styles/colors'

const ReceiveIcon: React.FC<SvgProps> = ({ width = 12.953, height = 9.559, ...rest }) => (
  <Svg width={width} height={height} viewBox="0 0 12.953 9.559" {...rest}>
    <Path
      fill="none"
      stroke={colors.titan}
      strokeLinecap="round"
      strokeWidth="1.5"
      d="M7.436 1.061.749 7.749v-5.78"
    />
    <Path
      fill="none"
      stroke={colors.titan}
      strokeLinecap="round"
      strokeWidth="1.5"
      d="M11.893 1.086 5.206 7.774h5.779"
    />
  </Svg>
)

export default ReceiveIcon

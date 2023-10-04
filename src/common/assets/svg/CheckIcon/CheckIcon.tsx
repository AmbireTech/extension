import React from 'react'
import Svg, { G, Path, Rect, SvgProps } from 'react-native-svg'

import colors from '@common/styles/colors'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const CheckIcon: React.FC<Props> = ({ width = 18, height = 18, color }) => (
  <Svg width={width} height={height} viewBox="0 0 18 18">
    <Rect
      width="18"
      height="18"
      rx="9"
      transform="translate(18 18) rotate(180)"
      fill={color || colors.turquoise}
    />
    <G transform="translate(2.954 4.189)">
      <Path
        d="M.964,11.679A.964.964,0,0,1,0,10.714V.964a.964.964,0,0,1,1.929,0v9.75A.964.964,0,0,1,.964,11.679Z"
        transform="translate(11.44 0) rotate(45)"
        fill={colors.titan}
      />
      <Path
        d="M.964,6.429A.964.964,0,0,1,0,5.464V.964a.964.964,0,0,1,1.929,0v4.5A.964.964,0,0,1,.964,6.429Z"
        transform="translate(0 5.076) rotate(-45)"
        fill={colors.titan}
      />
    </G>
  </Svg>
)

export default CheckIcon

import React from 'react'
import Svg, { Path, Rect, SvgProps } from 'react-native-svg'

import { colorPalette as colors } from '@modules/common/styles/colors'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const CopyIcon: React.FC<Props> = ({ width = 24, height = 24 }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24">
    <Rect width="24" height="24" fill="none" />
    <Path
      id="Shape"
      d="M1984,25a3,3,0,0,1-3-3V10a3,3,0,0,1,3-3h9a3,3,0,0,1,3,3V22a3,3,0,0,1-3,3Zm-1-15V22a1,1,0,0,0,1,1h9a1,1,0,0,0,1-1V10a1,1,0,0,0-1-1h-9A1,1,0,0,0,1983,10Zm-6,8V14c0-.014,0-.027,0-.041V9a6.007,6.007,0,0,1,6-6h6.5V3h.5a1,1,0,0,1,0,2h-7a4,4,0,0,0-4,4v7.5h0V18a1,1,0,1,1-2,0Z"
      transform="translate(-1975 -2.001)"
      fill={colors.titan}
    />
  </Svg>
)

export default CopyIcon

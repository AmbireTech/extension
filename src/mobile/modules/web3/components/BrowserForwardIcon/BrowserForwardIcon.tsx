import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import colors from '@common/styles/colors'

interface Props extends SvgProps {
  width?: number
  height?: number
  color?: string
}

const BrowserForwardIcon: React.FC<Props> = ({ width = 28, height = 28, color = colors.titan }) => (
  <Svg width={width} height={height} viewBox="0 0 28 28">
    <Path fill="none" d="M0 0h28v28H0z" />
    <Path
      d="M9 23.071 18.071 14 9 4.929"
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeWidth="2"
    />
  </Svg>
)

export default BrowserForwardIcon

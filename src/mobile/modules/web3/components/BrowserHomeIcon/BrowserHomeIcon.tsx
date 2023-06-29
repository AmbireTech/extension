import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import colors from '@common/styles/colors'

interface Props extends SvgProps {
  width?: number
  height?: number
  color?: string
}

const BrowserHomeIcon: React.FC<Props> = ({ width = 28, height = 28, color = colors.titan }) => (
  <Svg width={width} height={height} viewBox="0 0 28 28">
    <Path d="M0 0h28v28H0z" />
    <Path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="m7.202 11.734 6.8-5.287 6.8 5.287v8.313a1.511 1.511 0 0 1-1.511 1.511H8.713a1.511 1.511 0 0 1-1.511-1.511Z"
    />
    <Path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M11.734 21.553V14h4.532v7.553"
    />
  </Svg>
)

export default BrowserHomeIcon

import React from 'react'
import { ColorValue } from 'react-native'
import Svg, { Path, Rect, SvgProps } from 'react-native-svg'

import colors from '@common/styles/colors'

interface Props extends SvgProps {
  width?: number
  height?: number
  color?: ColorValue
}

const CloseIcon: React.FC<Props> = ({ width = 40, height = 40, color }) => (
  <Svg width={width} height={height} viewBox="0 0 40 40">
    <Rect width="40" height="40" rx="13" fill={colors.titan} opacity="0.05" />
    <Path
      d="M10,11a1,1,0,0,1-.707-.293l-10-10a1,1,0,0,1,0-1.414,1,1,0,0,1,1.414,0l10,10A1,1,0,0,1,10,11Z"
      transform="translate(15 15)"
      fill={color || colors.titan}
    />
    <Path
      d="M0,11a1,1,0,0,1-.707-.293,1,1,0,0,1,0-1.414l10-10a1,1,0,0,1,1.414,0,1,1,0,0,1,0,1.414l-10,10A1,1,0,0,1,0,11Z"
      transform="translate(15 15)"
      fill={color || colors.titan}
    />
  </Svg>
)

export default CloseIcon

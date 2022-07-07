import React from 'react'
import Svg, { Path, Rect, SvgProps } from 'react-native-svg'

import colors from '@modules/common/styles/colors'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const AddIcon: React.FC<Props> = ({ width = 24, height = 24 }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24">
    <Rect width="24" height="24" fill="none" />
    <Path
      d="M10,11a1,1,0,0,1-.707-.293l-10-10a1,1,0,0,1,0-1.414,1,1,0,0,1,1.414,0l10,10A1,1,0,0,1,10,11Z"
      transform="translate(12 4.929) rotate(45)"
      fill={colors.titan}
    />
    <Path
      d="M0,11a1,1,0,0,1-.707-.293,1,1,0,0,1,0-1.414l10-10a1,1,0,0,1,1.414,0,1,1,0,0,1,0,1.414l-10,10A1,1,0,0,1,0,11Z"
      transform="translate(12 4.929) rotate(45)"
      fill={colors.titan}
    />
  </Svg>
)

export default AddIcon

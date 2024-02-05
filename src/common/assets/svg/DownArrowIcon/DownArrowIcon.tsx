import React from 'react'
import { ColorValue } from 'react-native'
import Svg, { Path, SvgProps } from 'react-native-svg'

import { iconColors } from '@common/styles/themeConfig'

interface Props extends SvgProps {
  width?: number
  height?: number
  color?: ColorValue
}

const DownArrowIcon: React.FC<Props> = ({
  width = 15,
  height = 9,
  color = iconColors.primary,
  ...rest
}) => (
  <Svg width={width} height={height} viewBox="0 0 14.879 8.466" {...rest}>
    <Path
      d="M6.347,12.758,0,6.385,6.347,0"
      transform="translate(1.061 7.408) rotate(-90)"
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeWidth="1.5"
    />
  </Svg>
)

export default DownArrowIcon

import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import { iconColors } from '@common/styles/themeConfig'

const CopyIcon: React.FC<SvgProps> = ({
  width = 22,
  height = 22,
  color = iconColors.secondary,
  ...rest
}) => (
  <Svg width={width} height={height} viewBox="0 0 22 22" {...rest}>
    <G fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
      <Path d="M15 11.9v4.2c0 3.5-1.4 4.9-4.9 4.9H5.9C2.4 21 1 19.6 1 16.1v-4.2C1 8.4 2.4 7 5.9 7h4.2c3.5 0 4.9 1.4 4.9 4.9Z" />
      <Path d="M21 5.9v4.2c0 3.5-1.4 4.9-4.9 4.9H15v-3.1C15 8.4 13.6 7 10.1 7H7V5.9C7 2.4 8.4 1 11.9 1h4.2C19.6 1 21 2.4 21 5.9Z" />
    </G>
  </Svg>
)

export default CopyIcon

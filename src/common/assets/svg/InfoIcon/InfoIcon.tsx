import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import colors from '@common/styles/colors'

const InfoIcon: React.FC<SvgProps> = ({
  width = 24,
  height = 24,
  color = colors.martinique,
  ...rest
}) => (
  <Svg width={width} height={height} fill="none" viewBox="0 0 24 24" {...rest}>
    <G fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10.75 15.05V9.8" strokeWidth="1.5" />
      <Path d="M10.75 6.6v-.1" strokeWidth="2" />
      <Path d="M10.75 20.75a10 10 0 1 0-10-10 10.029 10.029 0 0 0 10 10Z" strokeWidth="1.5" />
    </G>
  </Svg>
)

export default InfoIcon

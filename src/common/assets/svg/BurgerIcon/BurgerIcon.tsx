import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import colors from '@common/styles/colors'

const BurgerIcon: React.FC<SvgProps> = ({
  width = 21.5,
  height = 14.5,
  color = colors.martinique,
  ...rest
}) => (
  <Svg viewBox="0 0 21.5 14.5" width={width} height={height} {...rest}>
    <G>
      <G fill="none" stroke={color} strokeLinecap="round" strokeWidth="1.5">
        <Path d="M.75 13.75h20" />
        <Path d="M2.75 7.25h16" />
        <Path d="M.75.75h20" />
      </G>
    </G>
  </Svg>
)

export default React.memo(BurgerIcon)

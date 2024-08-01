import React, { FC } from 'react'
import { G, Path, Svg, SvgProps } from 'react-native-svg'

import { iconColors } from '@common/styles/themeConfig'

const FlipIcon: FC<SvgProps> = ({ width, height, color = iconColors.secondary, ...rest }) => {
  return (
    <Svg viewBox="0 0 11.419 11.414" width={width} height={height} {...rest}>
      <G fill="none" stroke={color} strokeLinecap="round">
        <G>
          <Path d="m.707 8.217 2.49 2.49 2.49-2.49" />
          <Path d="M3.197 4.441v6.266" />
        </G>
        <G>
          <Path d="M10.712 3.197 8.222.707l-2.489 2.49" />
          <Path d="M8.222 6.973V.707" />
        </G>
      </G>
    </Svg>
  )
}

export default FlipIcon

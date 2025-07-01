import React from 'react'
import Svg, { G, Path, Rect, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const TwitterIcon: React.FC<SvgProps> = ({ width = 32, height = 32, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 32 32" {...rest}>
      <G transform="translate(-175 -459)">
        <Rect
          width="32"
          height="32"
          rx="6"
          transform="translate(175 459)"
          fill={theme.secondaryBackground}
        />
        <Path
          d="m200.16 467.697-3.353 15.816c-.253 1.116-.913 1.394-1.85.868l-5.11-3.765-2.466 2.371a1.283 1.283 0 0 1-1.027.5l.367-5.2 9.471-8.558c.412-.367-.089-.571-.64-.2l-11.709 7.366-5.044-1.578c-1.1-.342-1.116-1.1.228-1.622l19.715-7.6c.913-.342 1.712.2 1.414 1.6Z"
          fill={color || theme.iconPrimary}
        />
      </G>
    </Svg>
  )
}

export default React.memo(TwitterIcon)

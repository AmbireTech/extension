import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const PenIcon: React.FC<SvgProps> = ({ width = 48, height = 48, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 48 48" {...rest}>
      <G
        fill="none"
        stroke={color || theme.iconSecondary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <Path d="M25.7 13.943 13.675 25.971a4.145 4.145 0 0 0-1 2.016l-.645 4.59a2.175 2.175 0 0 0 2.6 2.6l4.589-.649a4.145 4.145 0 0 0 2.016-1L33.259 21.5c2.063-2.063 3.059-4.473 0-7.532-3.059-3.085-5.469-2.111-7.559-.025Z" />
        <Path d="M23.989 15.657a10.865 10.865 0 0 0 7.532 7.532" />
      </G>
      <G fill="none" stroke={color || theme.iconSecondary} strokeWidth="1.5">
        <Path d="M8 0h32a8 8 0 0 1 8 8v32a8 8 0 0 1-8 8H0V8a8 8 0 0 1 8-8Z" stroke="none" />
        <Path d="M8 .75h32A7.25 7.25 0 0 1 47.25 8v32A7.25 7.25 0 0 1 40 47.25H1.5a.75.75 0 0 1-.75-.75V8A7.25 7.25 0 0 1 8 .75Z" />
      </G>
      <G fill="none" stroke={color || theme.iconSecondary} strokeLinecap="round" strokeWidth="1.5">
        <Path d="M32.082 37.082h10" />
        <Path d="M37.082 32.082v10" />
      </G>
    </Svg>
  )
}

export default React.memo(PenIcon)

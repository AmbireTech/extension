import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const HiddenListIcon: React.FC<SvgProps> = ({ width = 48, height = 48, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 48 48" {...rest}>
      <G fill="none" stroke={color || theme.iconSecondary} strokeWidth="1.5">
        <G>
          <Path d="M8 0h32a8 8 0 0 1 8 8v32a8 8 0 0 1-8 8H0V8a8 8 0 0 1 8-8Z" stroke="none" />
          <Path d="M8 .75h32A7.25 7.25 0 0 1 47.25 8v32A7.25 7.25 0 0 1 40 47.25H1.5a.75.75 0 0 1-.75-.75V8A7.25 7.25 0 0 1 8 .75Z" />
        </G>
        <Path strokeLinecap="round" d="M14.5 14.107h19" />
        <Path strokeLinecap="round" d="M14.5 24h19" />
        <Path strokeLinecap="round" d="M14.5 33.893h10" />
        <G strokeLinecap="round" strokeLinejoin="round">
          <Path d="m38.612 35.522-3.223 3.223a2.279 2.279 0 1 1 3.223-3.223Z" />
          <Path d="M40.708 33.165a6.135 6.135 0 0 0-3.707-1.3 7.018 7.018 0 0 0-5.8 3.618 3.392 3.392 0 0 0 0 3.306 9.126 9.126 0 0 0 1.726 2.019" />
          <Path d="M34.72 41.93a5.87 5.87 0 0 0 2.281.471 7.018 7.018 0 0 0 5.8-3.618 3.393 3.393 0 0 0 0-3.306 10.333 10.333 0 0 0-.675-.936" />
          <Path d="M39.236 37.579a2.271 2.271 0 0 1-1.8 1.8" />
          <Path d="m35.388 38.745-4.758 4.758" />
          <Path d="m43.37 30.763-4.758 4.758" />
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(HiddenListIcon)

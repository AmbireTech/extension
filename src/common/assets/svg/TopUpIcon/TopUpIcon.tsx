import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const TopUpIcon: React.FC<Props> = ({ width = 30, height = 30, color, strokeWidth = '1.5' }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 16 16">
      <G fill="none">
        <G
          stroke={color || theme.iconSecondary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
        >
          <Path d="M5.777 9.556a1.52 1.52 0 0 0 1.484 1.555h1.671a1.323 1.323 0 0 0 1.289-1.36 1.174 1.174 0 0 0-.88-1.289l-2.675-.933a1.168 1.168 0 0 1-.88-1.289 1.329 1.329 0 0 1 1.291-1.358h1.671a1.52 1.52 0 0 1 1.484 1.555" />
          <Path d="M7.999 4.002v8" />
          <Path d="M14.5 8A6.5 6.5 0 1 1 8 1.5" />
          <Path d="M11.641 2.072v2.287h2.288" />
          <Path d="m14.5 1.5-2.859 2.859" />
        </G>
        <Path d="M0 16V0h16v16z" />
      </G>
    </Svg>
  )
}

export default React.memo(TopUpIcon)

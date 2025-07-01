import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const BugIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 21.5 21.81" {...rest}>
      <G
        fill="none"
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <Path d="m6.75 1.06 1.88 1.979" />
        <Path d="m12.87 3.039 1.88-1.979" />
        <Path d="M7.75 6.46V5.412a3.205 3.205 0 0 1 1.46-2.86 2.875 2.875 0 0 1 3.08 0 3.205 3.205 0 0 1 1.46 2.86V6.46" />
        <Path d="M10.75 20.007a6.182 6.182 0 0 1-6-6.316v-3.157a4.109 4.109 0 0 1 4-4.211h4a4.109 4.109 0 0 1 4 4.211v3.158a6.182 6.182 0 0 1-6 6.316" />
        <Path d="M10.75 20.008v-9.474" />
        <Path d="M5.28 8.429a4.155 4.155 0 0 1-3.53-4.211" />
        <Path d="M4.75 12.639h-4" />
        <Path d="M1.75 21.06a4.167 4.167 0 0 1 3.8-4.211" />
        <Path d="M19.72 4.218a4.156 4.156 0 0 1-3.5 4.211" />
        <Path d="M20.75 12.639h-4" />
        <Path d="M15.95 16.849a4.167 4.167 0 0 1 3.8 4.211" />
      </G>
    </Svg>
  )
}

export default React.memo(BugIcon)

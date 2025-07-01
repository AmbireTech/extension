import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const EarnIcon: React.FC<Props> = ({ width = 30, height = 30, color, strokeWidth = '1.5' }) => {
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
          <Path d="M4.34 10.472a2.5 2.5 0 0 0 2.44 2.557h2.747a2.175 2.175 0 0 0 2.113-2.235 1.93 1.93 0 0 0-1.446-2.119l-4.4-1.534a1.92 1.92 0 0 1-1.446-2.119 2.185 2.185 0 0 1 2.118-2.235H9.22a2.5 2.5 0 0 1 2.44 2.557" />
          <Path d="M7.993 1v14" />
        </G>
        <Path d="M0 16V0h16v16z" />
      </G>
    </Svg>
  )
}

export default React.memo(EarnIcon)

import React from 'react'
import Svg, { Circle, Ellipse, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const NetworksIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color }) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} viewBox="0 0 21.5 21.5" fill="none">
      <Circle cx="10.75" cy="10.75" r="10" stroke={color || theme.iconPrimary} strokeWidth="1.5" />
      <Ellipse
        cx="10.7498"
        cy="10.75"
        rx="3.33333"
        ry="10"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
      />
      <Path
        d="M0.75 10.75H20.75"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  )
}

export default React.memo(NetworksIcon)

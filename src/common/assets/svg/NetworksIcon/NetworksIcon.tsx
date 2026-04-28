import React from 'react'
import Svg, { Circle, Ellipse, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const NetworksIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color }) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color || theme.iconPrimary} strokeWidth="1.5" />
      <Ellipse
        cx="12"
        cy="12"
        rx="3"
        ry="9"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
      />
      <Path
        d="M3 12H21"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  )
}

export default React.memo(NetworksIcon)

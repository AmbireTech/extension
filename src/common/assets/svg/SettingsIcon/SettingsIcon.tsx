import React from 'react'
import Svg, { Circle, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const SettingsIcon: React.FC<SvgProps> = ({
  width = 24,
  height = 24,
  strokeWidth = '1.5',
  color,
  ...rest
}) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" {...rest} fill="none">
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="1.5"
        d="M5 12V4M19 20v-3M5 20v-4M19 13V4M12 7V4M12 20v-9"
      />
      <Circle
        cx="5"
        cy="14"
        r="2"
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <Circle
        cx="12"
        cy="9"
        r="2"
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <Circle
        cx="19"
        cy="15"
        r="2"
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </Svg>
  )
}

export default React.memo(SettingsIcon)

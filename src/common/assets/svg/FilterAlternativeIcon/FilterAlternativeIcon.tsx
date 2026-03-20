import React from 'react'
import Svg, { Circle, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const FilterAlternativeIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" {...rest}>
      <Path
        d="M12 7L20 7"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M4 7L8 7"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M17 17L20 17"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M4 17L12 17"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Circle
        cx="10"
        cy="7"
        r="2"
        transform="rotate(90 10 7)"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        fill="transparent"
        strokeLinecap="round"
      />
      <Circle
        cx="15"
        cy="17"
        r="2"
        transform="rotate(90 15 17)"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        fill="transparent"
        strokeLinecap="round"
      />
    </Svg>
  )
}

export default React.memo(FilterAlternativeIcon)

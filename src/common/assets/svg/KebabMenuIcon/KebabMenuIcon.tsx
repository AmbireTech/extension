import React from 'react'
import Svg, { Circle, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const KebabMenuIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} viewBox="0 0 28 28" {...rest} fill="none">
      <Circle
        cx="14"
        cy="14"
        r="1.167"
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="2"
        transform="rotate(90 14 14)"
      />
      <Circle
        cx="14"
        cy="7"
        r="1.167"
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="2"
        transform="rotate(90 14 7)"
      />
      <Circle
        cx="14"
        cy="21"
        r="1.167"
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="2"
        transform="rotate(90 14 21)"
      />
    </Svg>
  )
}

export default React.memo(KebabMenuIcon)

import React from 'react'
import Svg, { Circle, Path, Rect, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const KeyStoreSettingsIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" {...rest} fill="none">
      <Rect
        width="14"
        height="22"
        x="5"
        y="1"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        rx="2"
      />
      <Path stroke={color || theme.iconPrimary} strokeLinecap="round" d="M17 14.375H7" />
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m12 10 .179.627.633-.158-.454.469.454.468-.633-.158-.179.627-.179-.627-.633.158.454-.469-.454-.468.633.158L12 10ZM7.938 10l.179.627.632-.158-.453.469.453.468-.632-.158-.18.627-.179-.627-.632.158.453-.469-.453-.468.632.158.18-.627ZM16.063 10l.178.627.633-.158-.453.469.453.468-.633-.158-.178.627-.18-.627-.632.158.453-.469-.453-.468.633.158.178-.627Z"
      />
      <Path stroke={color || theme.iconPrimary} strokeLinecap="round" d="M9.5 3.5h5" />
      <Circle
        cx="12"
        cy="20"
        r=".5"
        fill={color || theme.iconPrimary}
        stroke={color || theme.iconPrimary}
      />
    </Svg>
  )
}

export default React.memo(KeyStoreSettingsIcon)

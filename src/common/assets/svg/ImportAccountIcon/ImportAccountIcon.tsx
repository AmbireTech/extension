import React from 'react'
import Svg, { Circle, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const ImportAccountIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="9"
        cy="9"
        r="3.25"
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <Path
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        d="M12.409 8.409a2.25 2.25 0 1 1-.464 2.506"
      />
      <Path
        fill={color || theme.iconPrimary}
        d="M14 15v-.75.75Zm3.72 2.904.707-.25-.707.25ZM13.881 19l-.735.148.121.602h.614V19Zm-2.098-3.287-.454-.597-.867.658.924.575.397-.636ZM13.999 15v.75c1.806 0 2.628 1.316 3.014 2.405l.707-.25.707-.251c-.454-1.28-1.642-3.404-4.428-3.404V15Zm3.721 2.904-.707.25a.084.084 0 0 1 .005.022v.008a.058.058 0 0 1-.008.01c-.017.021-.063.056-.143.056v1.5c1.009 0 1.97-.942 1.56-2.096l-.707.25ZM16.867 19v-.75H13.88v1.5h2.986V19Zm-2.986 0 .736-.148c-.213-1.055-.798-2.754-2.438-3.776l-.396.637-.397.636c1.124.7 1.58 1.908 1.76 2.8l.735-.149Zm-2.098-3.287.453.597c.43-.325.992-.56 1.764-.56v-1.5c-1.109 0-1.989.347-2.67.866l.453.597Z"
      />
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="1.5"
        d="M9 15c3.572 0 4.592 2.551 4.883 4.009.109.541-.33.991-.883.991H5c-.552 0-.992-.45-.883-.991C4.408 17.55 5.428 15 9 15ZM19 3v4M21 5h-4"
      />
    </Svg>
  )
}

export default React.memo(ImportAccountIcon)

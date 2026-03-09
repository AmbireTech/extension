import React from 'react'
import Svg, { Path, Rect } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'
import { LegendsSvgProps } from '@legends/types/svg'

const CopyIcon: React.FC<LegendsSvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 20 20" fill="none" {...rest}>
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M11.667 5.833c0-.464 0-.697-.039-.89a2 2 0 0 0-1.571-1.571c-.193-.039-.426-.039-.89-.039H7.333c-1.885 0-2.828 0-3.414.586s-.586 1.529-.586 3.414v1.834c0 .464 0 .697.039.89a2 2 0 0 0 1.571 1.571c.193.039.426.039.89.039"
      />
      <Rect
        width="8.333"
        height="8.333"
        x="8.333"
        y="8.333"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        rx="2"
      />
    </Svg>
  )
}

export default React.memo(CopyIcon)

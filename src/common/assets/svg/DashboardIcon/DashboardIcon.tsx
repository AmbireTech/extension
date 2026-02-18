import React, { FC } from 'react'
import Svg, { Rect, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const DashboardIcon: FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg fill="none" viewBox="0 0 24 24" width={width} height={height} {...rest}>
      <Rect
        width="6"
        height="7"
        x="4"
        y="4"
        stroke={color || theme.iconPrimary}
        strokeLinejoin="round"
        strokeWidth="1.5"
        rx="1"
      />
      <Rect
        width="6"
        height="5"
        x="4"
        y="15"
        stroke={color || theme.iconPrimary}
        strokeLinejoin="round"
        strokeWidth="1.5"
        rx="1"
      />
      <Rect
        width="6"
        height="5"
        x="14"
        y="4"
        stroke={color || theme.iconPrimary}
        strokeLinejoin="round"
        strokeWidth="1.5"
        rx="1"
      />
      <Rect
        width="6"
        height="7"
        x="14"
        y="13"
        stroke={color || theme.iconPrimary}
        strokeLinejoin="round"
        strokeWidth="1.5"
        rx="1"
      />
    </Svg>
  )
}

export default React.memo(DashboardIcon)

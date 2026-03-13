import React, { FC } from 'react'
import { Circle, Path, Svg, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const NoKeysIcon: FC<SvgProps> = ({ width = 24, height = 24, color }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="8.923"
        cy="15.077"
        r="4.923"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
      />
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="1.5"
        d="m12.616 11.385 4.307-4.308m1.846-1.846-1.846 1.846m0 0L20 10.154"
      />
      <Circle cx="7" cy="7" r="5" fill="#ff7089" />
      <Circle
        cx="3"
        cy="3"
        r="3"
        stroke="#fff"
        strokeLinecap="round"
        transform="matrix(-1 0 0 1 10 4)"
      />
      <Path stroke="#fff" d="m5 9 4.243-4.243" />
    </Svg>
  )
}

export default React.memo(NoKeysIcon)

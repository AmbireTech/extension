import React, { FC, memo } from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const RetryIcon: FC<SvgProps> = ({ width = 16, height = 17, color }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 16 17" fill="none">
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="1.5"
        d="m9.333 10-2.666 2.667 2.666 2.666"
      />
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="1.5"
        d="M3.959 10.333a4.667 4.667 0 1 1 3.34 2.28"
      />
    </Svg>
  )
}

export default memo(RetryIcon)

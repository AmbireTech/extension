import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const MaximizeIcon: React.FC<SvgProps> = ({
  width = 24,
  height = 24,
  color,
  strokeWidth = 1.5,
  ...rest
}) => {
  const { theme } = useTheme()

  return (
    <Svg viewBox="0 0 24 24" width={width} height={height} {...rest} fill="none">
      <Path
        d="M4 14V20H10M20 10V4H14"
        stroke={color || theme.iconPrimary}
        strokeWidth={strokeWidth}
      />
      <Path
        d="M4 20L9 15M20 4L15 9"
        stroke={color || theme.iconPrimary}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  )
}

export default React.memo(MaximizeIcon)

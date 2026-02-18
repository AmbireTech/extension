import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const OpenIcon: React.FC<SvgProps> = ({
  width = 20,
  height = 20,
  color,
  strokeWidth = '1.5',
  ...rest
}) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 20 20" {...rest} fill="none">
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth={strokeWidth}
        d="M11.2 4H16m0 0v4.8M16 4l-6.4 6.4M8.8 4.8H6a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h7.2a2 2 0 0 0 2-2v-2.8"
      />
    </Svg>
  )
}

export default React.memo(OpenIcon)

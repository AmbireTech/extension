import React, { FC } from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const NetworkStatusIcon: FC<SvgProps> = ({ width = 32, height = 32, color }) => {
  const { theme } = useTheme()

  return (
    <Svg
      width={width}
      height={height}
      stroke={color || theme.iconSecondary}
      strokeLinecap="round"
      viewBox="0 0 24 24"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <Path d="M12 20V10M18 20V4M6 20v-4" />
    </Svg>
  )
}

export default NetworkStatusIcon

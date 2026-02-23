import React from 'react'
import Svg, { Circle, Path } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'
import { LegendsSvgProps } from '@legends/types/svg'

const InfoIcon: React.FC<LegendsSvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} viewBox="0 0 16 16" fill="none" {...rest}>
      <Circle cx="8" cy="8" r="6" stroke={color || theme.iconPrimary} />
      <Path
        fill={color || theme.iconPrimary}
        stroke={color || theme.iconPrimary}
        d="M8.333 5a.333.333 0 1 1-.666 0 .333.333 0 0 1 .666 0Z"
      />
      <Path stroke={color || theme.iconPrimary} d="M8 11.333V6.667" />
    </Svg>
  )
}

export default React.memo(InfoIcon)

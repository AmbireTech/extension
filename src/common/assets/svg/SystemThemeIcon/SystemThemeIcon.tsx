import React from 'react'
import Svg, { Circle, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const SystemThemeIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24" {...rest}>
      <Circle cx="12" cy="12" r="8.75" stroke={color || theme.iconPrimary} strokeWidth="1.5" />
      <Path fill={color || theme.iconPrimary} d="M12 4a8 8 0 1 0 0 16V4Z" />
    </Svg>
  )
}

export default React.memo(SystemThemeIcon)

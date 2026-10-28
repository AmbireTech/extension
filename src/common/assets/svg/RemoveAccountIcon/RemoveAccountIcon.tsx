import React from 'react'
import Svg, { Circle, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

/** A person with a minus, on a tinted circle - accounts being removed */
const RemoveAccountIcon: React.FC<SvgProps> = ({ width = 72, height = 72, color }) => {
  const { theme } = useTheme()
  const strokeColor = color || theme.errorDecorative

  return (
    <Svg width={width} height={height} viewBox="0 0 72 72" fill="none">
      <Circle cx="36" cy="36" r="36" fill={theme.errorBackground} />
      <Circle cx="31.5" cy="30" r="6" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
      <Path
        d="M21 49.5C21 43.65 25.65 39 31.5 39C34.35 39 36.9 40.05 38.85 41.85"
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M42 45H51" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
    </Svg>
  )
}

export default React.memo(RemoveAccountIcon)

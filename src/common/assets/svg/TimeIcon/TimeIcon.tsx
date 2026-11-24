import React from 'react'
import Svg, { Circle, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

/**
 * The design's "Time" icon: a clock with its hands at three. Smaller in its box and with
 * straighter hands than `ClockIcon`.
 */
const TimeIcon: React.FC<SvgProps> = ({ width = 28, height = 28, color, ...rest }) => {
  const { theme } = useTheme()
  const iconColor = color || theme.iconPrimary

  return (
    <Svg width={width} height={height} viewBox="0 0 28 28" fill="none" {...rest}>
      <Circle cx="14" cy="14" r="10.3333" stroke={iconColor} strokeWidth="2" />
      <Path
        d="M19.25 14H14.25C14.1119 14 14 13.8881 14 13.75V9.91667"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  )
}

export default React.memo(TimeIcon)

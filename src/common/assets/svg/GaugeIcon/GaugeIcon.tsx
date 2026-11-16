import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import { FeeSpeed } from '@ambire-common/interfaces/signAccountOp'
import useTheme from '@common/hooks/useTheme'

// Degrees from straight up, spread evenly over the dial from left to right
const NEEDLE_ANGLE_BY_SPEED: Record<FeeSpeed, number> = {
  [FeeSpeed.Slow]: -75,
  [FeeSpeed.Medium]: -25,
  [FeeSpeed.Fast]: 25,
  [FeeSpeed.Ape]: 75
}

type Props = SvgProps & {
  /** Points the needle at this speed. Without it the needle points between fast and ape */
  speed?: FeeSpeed
}

const GaugeIcon: React.FC<Props> = ({ width = 20, height = 24, color, speed, ...rest }) => {
  const { theme } = useTheme()
  const fill = color || theme.iconPrimary
  const needleAngle = speed ? NEEDLE_ANGLE_BY_SPEED[speed] : 45

  return (
    // Cropped to the dial on the sides, so spacing next to the icon is not widened by empty space
    <Svg width={width} height={height} viewBox="2 0 20 24" fill="none" {...rest}>
      {/* The dial */}
      <Path
        d="M3.503 18.462A9.375 9.375 0 1 1 20.497 18.462A0.875 0.875 0 0 1 18.911 17.722A7.625 7.625 0 1 0 5.089 17.722A0.875 0.875 0 0 1 3.503 18.462Z"
        fill={fill}
      />
      {/* The needle, drawn pointing up and turned around the center of the dial */}
      <G transform={`rotate(${needleAngle} 12 14.5)`}>
        <Path d="M12 8L13.4 14.5A1.4 1.4 0 1 1 10.6 14.5Z" fill={fill} />
      </G>
    </Svg>
  )
}

export default React.memo(GaugeIcon)

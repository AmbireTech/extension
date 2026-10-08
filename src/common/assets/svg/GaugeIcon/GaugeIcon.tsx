import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const GaugeIcon: React.FC<SvgProps> = ({ width = 20, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  const fill = color || theme.iconPrimary

  return (
    // Cropped to the dial on the sides, so spacing next to the icon is not widened by empty space
    <Svg width={width} height={height} viewBox="2 0 20 24" fill="none" {...rest}>
      {/* The dial, cut where the needle passes through it */}
      <Path
        d="M2.5 16A9.5 9.5 0 0 1 18.107 8.723L16.821 10.255A7.5 7.5 0 0 0 4.5 16A1 1 0 0 1 2.5 16Z"
        fill={fill}
      />
      <Path
        d="M19.486 10.151A9.5 9.5 0 0 1 21.5 16A1 1 0 0 1 19.5 16A7.5 7.5 0 0 0 17.91 11.382Z"
        fill={fill}
      />
      {/* The needle */}
      <Path d="M19.913 8.358L12.973 17.007A1.4 1.4 0 1 1 11.027 14.993Z" fill={fill} />
    </Svg>
  )
}

export default React.memo(GaugeIcon)

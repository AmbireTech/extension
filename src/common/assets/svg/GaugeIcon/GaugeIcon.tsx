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
        d="M3.503 18.462A9.375 9.375 0 0 1 18.026 7.318L16.901 8.659A7.625 7.625 0 0 0 5.089 17.722A0.875 0.875 0 0 1 3.503 18.462Z"
        fill={fill}
      />
      <Path
        d="M19.388 8.728A9.375 9.375 0 0 1 20.497 18.462A0.875 0.875 0 0 1 18.911 17.722A7.625 7.625 0 0 0 18.009 9.806Z"
        fill={fill}
      />
      {/* The needle */}
      <Path d="M19.913 6.859L12.973 15.507A1.4 1.4 0 1 1 11.027 13.493Z" fill={fill} />
    </Svg>
  )
}

export default React.memo(GaugeIcon)

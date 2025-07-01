import React from 'react'
import Svg, { Circle, G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const DarkModeIcon: React.FC<SvgProps> = ({ width = 17, height = 17, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 16.757 16.752" {...rest}>
      <G transform="translate(-723.527 -571)">
        <Circle cx="8" cy="8" r="8" transform="translate(724.284 571)" fill="none" />
        <Path
          d="M2.025,89.891a7.887,7.887,0,0,0,14.236,4.014c.617-.841.286-1.4-.745-1.212a7.012,7.012,0,0,1-8.265-6.8,6.779,6.779,0,0,1,.564-2.765c.406-.939-.083-1.386-1.023-.985A7.806,7.806,0,0,0,2.025,89.891Z"
          transform="translate(722.281 489.853)"
          fill="none"
          stroke={color || theme.primary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </G>
    </Svg>
  )
}

export default React.memo(DarkModeIcon)

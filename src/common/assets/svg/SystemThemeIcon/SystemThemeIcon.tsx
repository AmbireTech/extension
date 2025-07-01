import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const SystemThemeIcon: React.FC<SvgProps> = ({ width = 22, height = 22, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 22 22" {...rest}>
      <G transform="translate(-1080.25 -575.25)">
        <G transform="translate(1081 576)">
          <Path
            d="M15.5,25.5a10,10,0,1,0-10-10A10,10,0,0,0,15.5,25.5Z"
            transform="translate(-5.501 -5.5)"
            fill="none"
            stroke={color || theme.primaryBackgroundInverted}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </G>
        <Path
          d="M0,20H0V0A10.015,10.015,0,0,1,10,10,10.011,10.011,0,0,1,0,20Z"
          transform="translate(1090.997 575.999)"
          fill={color || theme.primaryBackgroundInverted}
        />
      </G>
    </Svg>
  )
}

export default React.memo(SystemThemeIcon)

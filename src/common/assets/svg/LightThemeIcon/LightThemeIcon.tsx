import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const LightThemeIcon: React.FC<SvgProps> = ({ width = 22, height = 22, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 22 22" {...rest}>
      <G transform="translate(-998 -542)">
        <G transform="translate(999 543)">
          <Path
            d="M12,18.5A6.5,6.5,0,1,0,5.5,12,6.5,6.5,0,0,0,12,18.5Z"
            transform="translate(-2.001 -2)"
            fill="none"
            stroke={color || theme.primaryBackgroundInverted}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <Path
            d="M19.142,19.14l-.13-.13m0-14.02.13-.13ZM4.861,19.14l.13-.13ZM12,2.08v0ZM12,22v0ZM2.081,12h0ZM22,12h0ZM4.991,4.99l-.13-.13Z"
            transform="translate(-2.001 -2)"
            fill="none"
            stroke={color || theme.primaryBackgroundInverted}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(LightThemeIcon)

import React from 'react'
import Svg, { Circle, G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const DarkThemeIcon: React.FC<SvgProps> = ({ width = 21, height = 21, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 21 21" {...rest}>
      <G transform="translate(-723.525 -571)">
        <Circle cx="10" cy="10" r="10" transform="translate(724.284 571)" fill="none" />
        <Path
          d="M2.03,91.865a9.859,9.859,0,0,0,17.8,5.018c.771-1.051.357-1.751-.931-1.515a8.765,8.765,0,0,1-10.331-8.5,8.473,8.473,0,0,1,.705-3.456c.508-1.174-.1-1.733-1.278-1.231A9.758,9.758,0,0,0,2.03,91.865Z"
          transform="translate(722.282 490.065)"
          fill="none"
          stroke={color || theme.primaryBackgroundInverted}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </G>
    </Svg>
  )
}

export default React.memo(DarkThemeIcon)

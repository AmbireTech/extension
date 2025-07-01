import React from 'react'
import Svg, { Circle, G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const ClockIcon: React.FC<SvgProps> = ({ width = 16, height = 16, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 16 16" {...rest}>
      <G transform="translate(-738 -182)">
        <Path
          d="M34.894,33.646l-2.48-1.48a1.772,1.772,0,0,1-.784-1.376V27.51"
          transform="translate(714.371 158.49)"
          fill="none"
          stroke={color || theme.iconPrimary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <G transform="translate(738 182)" fill="none" stroke={color} strokeWidth="1.5">
          <Circle cx="8" cy="8" r="8" stroke="none" />
          <Circle cx="8" cy="8" r="7.25" fill="none" />
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(ClockIcon)

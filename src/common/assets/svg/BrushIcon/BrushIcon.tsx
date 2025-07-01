import React from 'react'
import Svg, { G, Path, Rect, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const BrushIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" {...rest}>
      <Rect width={24} height={24} rx={6} transform="translate(24 24) rotate(180)" fill="none" />
      <G id="brush" transform="translate(-1014.102 -328)">
        <Path
          d="M5.6,4.4V3.2h-4A1.564,1.564,0,0,1,.472,2.728,1.564,1.564,0,0,1,0,1.6,1.611,1.611,0,0,1,1.448.008.919.919,0,0,1,1.6,0h12a.919.919,0,0,1,.152.008,1.521,1.521,0,0,1,.976.464,1.581,1.581,0,0,1,.464,1.272A1.655,1.655,0,0,1,13.512,3.2H9.6V4.4a2,2,0,0,1-4,0Z"
          transform="translate(1033.7 338.4) rotate(180)"
          fill="none"
          stroke={color || theme.iconPrimary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1"
        />
        <Path
          d="M13.085,2.64,12.7,9.608a.919.919,0,0,0-.152-.008h-12A.919.919,0,0,0,.4,9.608L.013,2.64A2.4,2.4,0,0,1,2.4,0h8.3A2.4,2.4,0,0,1,13.085,2.64Z"
          transform="translate(1032.649 348) rotate(180)"
          fill="none"
          stroke={color || theme.iconPrimary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1"
        />
        <Path
          d="M0,0V4"
          transform="translate(1029.309 348) rotate(180)"
          fill="none"
          stroke={color || theme.iconPrimary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1"
        />
        <Path
          d="M0,0V1.6"
          transform="translate(1026.101 348) rotate(180)"
          fill="none"
          stroke={color || theme.iconPrimary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1"
        />
      </G>
    </Svg>
  )
}

export default React.memo(BrushIcon)

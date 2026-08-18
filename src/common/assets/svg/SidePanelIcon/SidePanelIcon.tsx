import React from 'react'
import Svg, { Path, Rect, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const SidePanelIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        d="M8.87243 14L11 12L8.87243 10M11 12H6"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 5H17C18.8856 5 19.8284 5 20.4142 5.58579C21 6.17157 21 7.11438 21 9V15C21 16.8856 21 17.8284 20.4142 18.4142C19.8284 19 18.8856 19 17 19H14V5Z"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Rect
        x={3}
        y={5}
        width={18}
        height={14}
        rx={2}
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  )
}

export default React.memo(SidePanelIcon)

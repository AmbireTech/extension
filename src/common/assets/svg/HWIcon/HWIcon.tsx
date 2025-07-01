import React from 'react'
import Svg, { G, Path, Rect, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const HWIcon: React.FC<SvgProps> = ({ width = 27, height = 36, color, strokeWidth = 1.5 }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 27.167 35.722">
      <G transform="translate(0.75 0.75)">
        <Path
          d="M22.169,0H3.5A3.444,3.444,0,0,0,0,3.389l.006,20.96a3.312,3.312,0,0,0,.576,1.862l4.4,6.485a3.528,3.528,0,0,0,2.922,1.526h9.817A3.528,3.528,0,0,0,20.647,32.7l4.407-6.488a3.313,3.313,0,0,0,.576-1.857l.038-20.958A3.444,3.444,0,0,0,22.169,0"
          transform="translate(0 0)"
          fill="none"
          stroke={color || theme.iconPrimary}
          strokeWidth={strokeWidth}
        />
        <G transform="translate(4.217 6.937)">
          <G fill="none" stroke={color || theme.iconPrimary} strokeWidth={strokeWidth}>
            <Rect width="17.232" height="10.851" rx="2" stroke="none" />
            <Rect x="0.75" y="0.75" width="15.732" height="9.351" rx="1.25" fill="none" />
          </G>
          <G
            transform="translate(0 13.355)"
            fill="none"
            stroke={color || theme.iconPrimary}
            strokeWidth={strokeWidth}
          >
            <Rect width="6.893" height="3.339" rx="1.669" stroke="none" />
            <Rect x="0.75" y="0.75" width="5.393" height="1.839" rx="0.919" fill="none" />
          </G>
          <G
            transform="translate(10.339 13.355)"
            fill="none"
            stroke={color || theme.iconPrimary}
            strokeWidth={strokeWidth}
          >
            <Rect width="6.893" height="3.339" rx="1.669" stroke="none" />
            <Rect x="0.75" y="0.75" width="5.393" height="1.839" rx="0.919" fill="none" />
          </G>
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(HWIcon)

import React from 'react'
import Svg, { G, Path, Rect, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const DAppsIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" {...rest}>
      <G transform="translate(3.477 3.462)">
        <Rect
          width={width}
          height={width}
          transform="translate(-3.477 20.538) rotate(-90)"
          fill="none"
        />
        <G transform="translate(0.218 0.23)">
          <Rect
            width={6.231}
            height={6.231}
            rx={1}
            transform="translate(10.385)"
            fill="none"
            stroke={color || theme.iconSecondary}
            strokeLinecap="round"
            strokeWidth={1.5}
          />
          <Path
            d="M329.75,16.25h4.385c.87,0,1.305,0,1.576.27s.27.706.27,1.576v2.538c0,.87,0,1.305-.27,1.576s-.705.27-1.576.27H329.75Z"
            transform="translate(-323.519 -5.865)"
            fill="none"
            stroke={color || theme.iconSecondary}
            strokeLinecap="round"
            strokeWidth={1.5}
          />
          <Path
            d="M329.231,11.346c0-.87,0-1.305-.27-1.576s-.705-.27-1.576-.27h-2.538c-.87,0-1.305,0-1.576.27s-.27.706-.27,1.576v4.385h6.231Z"
            transform="translate(-323 -5.346)"
            fill="none"
            stroke={color || theme.iconSecondary}
            strokeLinecap="round"
            strokeWidth={1.5}
          />
          <Path
            d="M329.231,22.481h-4.385c-.87,0-1.305,0-1.576-.27S323,21.5,323,20.635V16.25h6.231Z"
            transform="translate(-323 -5.865)"
            fill="none"
            stroke={color || theme.iconSecondary}
            strokeLinecap="round"
            strokeWidth={1.5}
          />
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(DAppsIcon)

import React from 'react'
import Svg, { G, Path, Rect, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const SwapAndBridgeIcon: React.FC<SvgProps> = ({
  width = 24,
  height = 24,
  color,
  strokeWidth = 1.5,
  ...rest
}) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" {...rest}>
      <Rect width={width} height={width} transform="translate(24 0) rotate(90)" fill="none" />
      <G transform="translate(3.385 1.23)">
        <Path
          d="M48.974,16.244l-4.308,4.308m0,0,4.308,4.308m-4.308-4.308H57.128a3.692,3.692,0,0,0,3.692-3.692V15.167"
          transform="translate(-44.666 -3.32)"
          fill="none"
          stroke={color || theme.iconSecondary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
        />
        <Path
          d="M57.68,10.949l4.308-4.308m0,0L57.68,2.333m4.308,4.308H49.526a3.692,3.692,0,0,0-3.692,3.692v1.692"
          transform="translate(-44.756 -2.333)"
          fill="none"
          stroke={color || theme.iconSecondary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
        />
      </G>
    </Svg>
  )
}

export default React.memo(SwapAndBridgeIcon)

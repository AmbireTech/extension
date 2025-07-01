import React from 'react'
import Svg, { G, Path, Rect, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const ReceiveIcon: React.FC<SvgProps> = ({
  width = 24,
  height = 24,
  color,
  strokeWidth = '1.5',
  ...rest
}) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24" {...rest}>
      <G id="receive_icon" data-name="receive icon" transform="translate(23.889 23.8) rotate(180)">
        <Rect
          width={width}
          height={height}
          transform="translate(-0.111 23.8) rotate(-90)"
          fill="none"
        />
        <G transform="translate(19.889 19.801) rotate(180)">
          <Path
            id="Path_17990"
            data-name="Path 17990"
            d="M0,0H.56V.56H0Z"
            transform="translate(9.777 9.942)"
            fill="none"
            stroke={color || theme.iconSecondary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
          <Path
            d="M0,0H.56V.56H0Z"
            transform="translate(15.44 9.942)"
            fill="none"
            stroke={color || theme.iconSecondary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
          <Path
            d="M0,0H.56V.56H0Z"
            transform="translate(9.777 15.439)"
            fill="none"
            stroke={color || theme.iconSecondary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
          <Path
            d="M0,0H.56V.56H0Z"
            transform="translate(15.44 15.439)"
            fill="none"
            stroke={color || theme.iconSecondary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
          <Path
            d="M0,0H.56V.56H0Z"
            transform="translate(12.608 12.61)"
            fill="none"
            stroke={color || theme.iconSecondary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
          <Path
            d="M0,0H.56V.56H0Z"
            transform="translate(2.831 2.831)"
            fill="none"
            stroke={color || theme.iconSecondary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
          <Rect
            width={6.222}
            height={6.222}
            rx={1}
            fill="none"
            stroke={color || theme.iconSecondary}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
          />
          <Path
            d="M0,0H.56V.56H0Z"
            transform="translate(2.831 12.61)"
            fill="none"
            stroke={color || theme.iconSecondary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
          <Rect
            width={6.222}
            height={6.222}
            rx={1}
            transform="translate(0 9.778)"
            fill="none"
            stroke={color || theme.iconSecondary}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
          />
          <Path
            d="M0,0H.56V.56H0Z"
            transform="translate(12.608 2.832)"
            fill="none"
            stroke={color || theme.iconSecondary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
          <Rect
            width={6.222}
            height={6.222}
            rx={1}
            transform="translate(9.778)"
            fill="none"
            stroke={color || theme.iconSecondary}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
          />
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(ReceiveIcon)

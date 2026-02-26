import React from 'react'
import Svg, { Path, Rect, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const HWIcon: React.FC<SvgProps> = ({
  width = 24,
  height = 24,
  color,
  strokeWidth = 1.5,
  ...rest
}) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...rest}>
      <Rect
        width="14.5"
        height="6.5"
        x="4.75"
        y="13.75"
        stroke={color || theme.iconPrimary}
        strokeWidth={strokeWidth}
        rx="1.25"
      />
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth={strokeWidth}
        d="m5.5 13.814 9.4-9.4a2 2 0 0 1 2.828 0l1.414 1.414a2 2 0 0 1 0 2.829l-2.475 2.475"
      />
    </Svg>
  )
}

export default React.memo(HWIcon)

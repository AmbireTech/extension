import React, { FC, memo } from 'react'
import { Circle, Path, Rect, Svg } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'
import { LegendsSvgProps } from '@legends/types/svg'

const GalleryIcon: FC<LegendsSvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...rest}>
      <Rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="3"
        stroke={color || theme.iconPrimary}
        strokeWidth={1.8}
      />
      <Circle cx="15.5" cy="8.5" r="1.6" stroke={color || theme.iconPrimary} strokeWidth={1.8} />
      <Path
        d="M3.5 17l4.5-4.5a2 2 0 0 1 2.83 0L20.5 21"
        stroke={color || theme.iconPrimary}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default memo(GalleryIcon)

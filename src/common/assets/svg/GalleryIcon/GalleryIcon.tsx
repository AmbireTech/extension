import React, { FC, memo } from 'react'
import { Circle, Path, Svg } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'
import { LegendsSvgProps } from '@legends/types/svg'

const GalleryIcon: FC<LegendsSvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 22 22" fill="none" {...rest}>
      <Path
        d="M2.25 14.75H6.75V19.25M6.75 14.75L1.75 19.75"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M10.75 20.75H16.75C18.9591 20.75 20.75 18.9591 20.75 16.75V4.75C20.75 2.54086 18.9591 0.75 16.75 0.75H4.75C2.54086 0.75 0.75 2.54086 0.75 4.75V10.75"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M6.75 6.75L10.3736 12.3044C11.0255 13.3037 12.4016 13.5136 13.3218 12.7541L14.998 11.3706C15.8105 10.6999 17.0041 10.7747 17.7267 11.5415L20.75 14.75"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Circle cx="15.25" cy="6.25" r="1.5" fill={color || theme.iconPrimary} />
    </Svg>
  )
}

export default memo(GalleryIcon)

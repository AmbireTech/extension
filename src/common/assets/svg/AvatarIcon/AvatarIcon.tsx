import React, { FC, memo } from 'react'
import Svg, { G, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const AvatarIcon: FC<SvgProps> = ({ width = 24, height = 24, color }) => {
  const {
    theme: { iconSecondary }
  } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 21.5 21.5" fill="none">
      <G
        fill="none"
        stroke={color || iconSecondary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <path d="M10.87 11.53a.963.963 0 0 0-.24 0 3.28 3.28 0 1 1 .24 0Z" />
        <path d="M17.49 18.13a9.979 9.979 0 0 1-13.48 0 3.679 3.679 0 0 1 1.77-2.58 9.73 9.73 0 0 1 9.94 0 3.679 3.679 0 0 1 1.77 2.58Z" />
        <path d="M10.75 20.75a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z" />
      </G>
    </Svg>
  )
}

export default memo(AvatarIcon)

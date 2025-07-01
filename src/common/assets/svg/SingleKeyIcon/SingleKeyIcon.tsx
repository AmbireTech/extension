import React, { FC } from 'react'
import { G, Path, Svg, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const SingleKeyIcon: FC<SvgProps> = ({ width = 17.41, height = 17.41, color }) => {
  const { theme } = useTheme()
  return (
    <Svg viewBox="0 0 17.414 17.408" width={width} height={height}>
      <G
        fill="none"
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <Path d="M14.906 11.024a6.023 6.023 0 0 1-6.045 1.487l-3.743 3.737a1.539 1.539 0 0 1-1.185.39L2.2 16.399a1.5 1.5 0 0 1-1.193-1.193l-.239-1.733a1.6 1.6 0 0 1 .39-1.185l3.737-3.736a6.02 6.02 0 1 1 10.01 2.473Z" />
        <Path d="m4.649 13.06 1.829 1.829" />
        <Path d="M10.699 8.458a1.748 1.748 0 1 0-1.748-1.752 1.748 1.748 0 0 0 1.748 1.752Z" />
      </G>
    </Svg>
  )
}

export default React.memo(SingleKeyIcon)

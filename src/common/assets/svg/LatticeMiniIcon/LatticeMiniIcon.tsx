import React from 'react'
import Svg, { Circle, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const LatticeMiniIcon: React.FC<SvgProps> = ({ width = 32, height = 32, ...styles }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 32 32" {...styles}>
      <Circle cx="16" cy="16" r="16" fill={theme.secondaryBackgroundInverted} />
      <Path fill="none" d="M0 0h32v32H0z" />
      <Path
        d="M29.88 12.573h-1.713v-1.685h-1.433v1.685h-1.71v1.345h1.71v1.685h1.431v-1.685h1.713Z"
        fill="#41b6e6"
      />
      <Path
        d="M7.617 18.707a3.211 3.211 0 0 1-1.393.289 2.492 2.492 0 0 1-2.583-2.528 2.431 2.431 0 0 1 2.593-2.486 3.324 3.324 0 0 1 1.865.514l.654-1.179a4.376 4.376 0 0 0-2.585-.719 3.867 3.867 0 1 0-.032 7.726 4.533 4.533 0 0 0 2.872-.879v-2.968H7.617Z"
        fill={theme.primaryBackground}
      />
      <Path
        d="M16.432 15.37c0-1.731-1.258-2.8-3.143-2.8H10.52v7.755h1.522v-2.217h1.335l1.511 2.217h1.8l-1.779-2.555a2.532 2.532 0 0 0 1.523-2.4Zm-3.276 1.4h-1.113v-2.864h1.125c1 0 1.687.54 1.687 1.466 0 .849-.673 1.4-1.7 1.4Z"
        fill={theme.primaryBackground}
      />
      <Path fill={theme.primaryBackground} d="M18.014 12.572h1.522v7.753h-1.522z" />
      <Path
        d="M28.16 16.513v-.233h-1.419v.233s-.015.564-.04.75c-.145 1.084-1.175 1.716-2.489 1.716h-1.4v-5.062h1.408V12.57h-2.93v7.755h2.989c2.148 0 3.713-1.174 3.883-3.061.015-.187-.002-.751-.002-.751Z"
        fill={theme.primaryBackground}
      />
    </Svg>
  )
}

export default React.memo(LatticeMiniIcon)

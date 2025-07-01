import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const PrivateKeyIcon: React.FC<SvgProps> = ({ width = 43, height = 50, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 43.285 50.116" {...rest}>
      <G
        fill="none"
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <Path d="M30.39 26.408a8.5 8.5 0 0 1-8.533 2.1l-5.288 5.277a2.173 2.173 0 0 1-1.673.55l-2.448-.337a2.119 2.119 0 0 1-1.684-1.684l-.337-2.448a2.262 2.262 0 0 1 .55-1.673l5.277-5.277a8.5 8.5 0 1 1 14.135 3.492Z" />
        <Path d="m15.907 29.282 2.582 2.582" />
        <Path d="M24.451 22.777a2.468 2.468 0 1 0-2.468-2.468 2.468 2.468 0 0 0 2.468 2.468Z" />
        <Path d="M17.99 1.675 6.017 6.187A8.329 8.329 0 0 0 1 13.412v17.834a11.669 11.669 0 0 0 4.153 8.257l10.321 7.705a10.925 10.925 0 0 0 12.337 0l10.321-7.705a11.669 11.669 0 0 0 4.153-8.257V13.412a8.334 8.334 0 0 0-5.017-7.249L25.29 1.675a12.205 12.205 0 0 0-7.3 0Z" />
      </G>
    </Svg>
  )
}

export default React.memo(PrivateKeyIcon)

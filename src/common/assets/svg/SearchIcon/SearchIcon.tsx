import React from 'react'
import Svg, { Circle, Path } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'
import { LegendsSvgProps } from '@legends/types/svg'

const SearchIcon: React.FC<LegendsSvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...rest}>
      <Circle cx="11" cy="11" r="7" stroke="#96A1B1" strokeWidth="1.5" />
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="1.5"
        d="M11 8a3 3 0 0 0-3 3M20 20l-4-4"
      />
    </Svg>
  )
}

export default React.memo(SearchIcon)

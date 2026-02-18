import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const BurgerIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 28 28" fill="none" {...rest}>
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="1.5"
        d="M5.833 8.167h16.334M5.833 14h16.334M5.833 19.833h16.334"
      />
    </Svg>
  )
}

export default React.memo(BurgerIcon)

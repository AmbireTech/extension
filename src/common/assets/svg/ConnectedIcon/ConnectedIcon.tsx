import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const ConnectedIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 20 20" {...rest} fill="none">
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M14.521 10.607 9.393 5.479l1.538-1.538a3.626 3.626 0 1 1 5.128 5.128l-1.538 1.538ZM16.327 3.673 18 2M5.482 9.391l5.128 5.128-1.538 1.539a3.627 3.627 0 1 1-5.128-5.128l1.538-1.539ZM2 17.999l1.679-1.68M8.607 8.315l-1.48 1.479M11.687 11.389l-1.482 1.482"
      />
    </Svg>
  )
}

export default React.memo(ConnectedIcon)

import React, { FC } from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const GnsIcon: FC<
  SvgProps & {
    isActive?: boolean
  }
> = ({ width = 24, height = 24, color, isActive, ...rest }) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} fill="none" {...rest} viewBox="0 0 16 16">
      <Path
        opacity={isActive ? '1' : '0.5'}
        fill={color || theme.iconPrimary}
        d="M3 3h10v2H3zM3 3h2v11H3zM3 12h10v2H3zM11 9h2v5h-2zM8 9h5v2H8z"
      />
    </Svg>
  )
}

export default React.memo(GnsIcon)

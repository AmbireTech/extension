import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const HelpIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" {...rest} fill="none">
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M16.5 9.75H18a3 3 0 0 1 3 3v1.875a3 3 0 0 1-3 3h-1.5V9.75ZM3 12.75a3 3 0 0 1 3-3h1.5v7.875H6a3 3 0 0 1-3-3V12.75Z"
      />
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M18.75 17.625V21M18.75 21h-5.625M18.75 9.75a6.75 6.75 0 0 0-13.5 0"
      />
    </Svg>
  )
}

export default React.memo(HelpIcon)

import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const LinkIcon: React.FC<SvgProps> = ({ width = 20, height = 20, color, ...rest }) => {
  const { theme } = useTheme()
  const strokeColor = color || theme.iconPrimary

  return (
    <Svg width={width} height={height} viewBox="0 0 20 20" fill="none" {...rest}>
      <Path
        stroke={strokeColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="m11.667 8.333-3.333 3.334"
      />
      <Path
        stroke={strokeColor}
        strokeLinecap="round"
        strokeWidth="1.5"
        d="M13.333 10.833 15 9.167A2.946 2.946 0 0 0 10.833 5L9.166 6.667m-2.5 2.5L5 10.833A2.946 2.946 0 0 0 9.167 15l1.666-1.667"
      />
    </Svg>
  )
}

export default React.memo(LinkIcon)

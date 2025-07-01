import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const LinkIcon: React.FC<SvgProps> = ({ width = 14, height = 14, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 13.5 13.5" {...rest}>
      <G transform="translate(-2.498 -2.411)">
        <Path
          d="M9.942,10.94a3.921,3.921,0,1,1-5.546,0"
          transform="translate(0 -2.473)"
          fill="none"
          stroke={color || theme.iconPrimary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <Path
          d="M10.034,10.152a4.095,4.095,0,1,1,5.791,0"
          transform="translate(-1.777 0)"
          fill="none"
          stroke={color || theme.iconPrimary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </G>
    </Svg>
  )
}

export default React.memo(LinkIcon)

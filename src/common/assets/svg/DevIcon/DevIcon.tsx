import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const DevIcon: React.FC<SvgProps> = ({ width = 21.5, height = 21.5, color }) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} viewBox="0 0 21.5 21.5">
      <G transform="translate(-1.25 -1.25)">
        <Path
          d="M6.89,9a6.293,6.293,0,0,1,2.43,2.15,1.524,1.524,0,0,1,0,1.71A6.349,6.349,0,0,1,6.89,15"
          fill="none"
          stroke={color || theme.iconPrimary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <Path
          d="M13,15h4"
          fill="none"
          stroke={color || theme.iconPrimary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <Path
          d="M9,22h6c5,0,7-2,7-7V9c0-5-2-7-7-7H9C4,2,2,4,2,9v6C2,20,4,22,9,22Z"
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

export default React.memo(DevIcon)

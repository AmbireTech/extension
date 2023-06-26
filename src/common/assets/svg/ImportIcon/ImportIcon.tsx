import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import colors from '@common/styles/colors'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const ImportIcon: React.FC<Props> = ({ width = 64, height = 64 }) => (
  <Svg width={width} height={height} viewBox="0 0 64 64">
    <G transform="translate(10.378 18.486)">
      <Path
        d="M43.245,6V17.487a4.373,4.373,0,0,1-4.633,4.054H4.633A4.373,4.373,0,0,1,0,17.487V6"
        transform="translate(0 5.487)"
        fill="none"
        stroke={colors.titan}
        strokeWidth="1.5"
      />
      <G transform="translate(17.111)">
        <Path
          d="M396,264.658V283.54"
          transform="translate(-391.493 -264.658)"
          fill="none"
          stroke={colors.titan}
          strokeLinecap="round"
          strokeWidth="1.5"
        />
        <Path
          d="M398.3,287l-4.483,4.483L389.331,287"
          transform="translate(-389.331 -271.904)"
          fill="none"
          stroke={colors.titan}
          strokeLinecap="round"
          strokeWidth="1.5"
        />
      </G>
    </G>
  </Svg>
)

export default ImportIcon

import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import colors from '@common/styles/colors'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const BrowserIcon: React.FC<Props> = ({ width = 27, height = 27 }) => (
  <Svg width={width} height={height} viewBox="0 0 27 27">
    <G transform="translate(-1.5 -1.5)">
      <Path
        d="M27,15A12,12,0,1,1,15,3,12,12,0,0,1,27,15Z"
        fill="none"
        stroke={colors.titan}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
      <Path
        id="Path_3071"
        data-name="Path 3071"
        d="M3,18H27"
        transform="translate(0 -3)"
        fill="none"
        stroke={colors.titan}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
      <Path
        id="Path_3072"
        data-name="Path 3072"
        d="M16.8,3a18.36,18.36,0,0,1,4.8,12,18.36,18.36,0,0,1-4.8,12A18.36,18.36,0,0,1,12,15,18.36,18.36,0,0,1,16.8,3Z"
        transform="translate(-1.8)"
        fill="none"
        stroke={colors.titan}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </G>
  </Svg>
)

export default BrowserIcon

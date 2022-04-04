import React from 'react'
import Svg, { G, Path, Rect, SvgProps } from 'react-native-svg'

import { colorPalette as colors } from '@modules/common/styles/colors'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const InfoIcon: React.FC<Props> = ({ width = 24, height = 24 }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24">
    <G transform="translate(78 849) rotate(180)">
      <Rect width="24" height="24" transform="translate(54 825)" fill="none" />
      <Path
        d="M1987,23a10,10,0,1,1,10-10A10.012,10.012,0,0,1,1987,23Zm0-8a1,1,0,1,0,1,1A1,1,0,0,0,1987,15Zm0-8a1,1,0,0,0-1,1v5a1,1,0,1,0,2,0V8A1,1,0,0,0,1987,7Z"
        transform="translate(-1921 824)"
        fill={colors.titan}
      />
    </G>
  </Svg>
)

export default InfoIcon

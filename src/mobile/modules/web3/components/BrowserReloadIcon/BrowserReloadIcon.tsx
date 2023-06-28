import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import colors from '@common/styles/colors'

interface Props extends SvgProps {
  width?: number
  height?: number
  color?: string
}

const BrowserReloadIcon: React.FC<Props> = ({ width = 28, height = 28, color = colors.titan }) => (
  <Svg width={width} height={height} viewBox="0 0 28 28">
    <Path
      d="M14.313 5.957a8.044 8.044 0 1 0 5.711 13.754l-1.448-1.448a6.037 6.037 0 1 1-4.283-10.3 5.85 5.85 0 0 1 4.2 1.83l-2.189 2.197h6.033V5.957L19.944 8.35a8 8 0 0 0-5.651-2.393Z"
      fill={color}
    />
    <Path fill="none" d="M0 0h28v28H0z" />
  </Svg>
)

export default BrowserReloadIcon

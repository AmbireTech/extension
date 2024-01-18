import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import colors from '@common/styles/colors'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const ErrorIcon: React.FC<Props> = ({ width = 20, height = 18, color }) => (
  <Svg width={width} height={height} viewBox="0 0 20 18">
    <Path
      d="M9.7,5.956a3.638,3.638,0,0,1,6.243,0l6.417,11.081a3.462,3.462,0,0,1-3.121,5.15H6.4a3.462,3.462,0,0,1-3.121-5.15Z"
      transform="translate(-2.819 -4.187)"
      fill={color || colors.pink}
    />
    <Path
      d="M-3970,15.931a1,1,0,0,1-1-.994,1,1,0,0,1,1-.994,1,1,0,0,1,1,.994A1,1,0,0,1-3970,15.931Zm0-3.975a1,1,0,0,1-1-.994V5.994A1,1,0,0,1-3970,5a1,1,0,0,1,1,.994v4.969A1,1,0,0,1-3970,11.956Z"
      transform="translate(3979.999 -0.239)"
      fill="#fff"
    />
  </Svg>
)

export default ErrorIcon

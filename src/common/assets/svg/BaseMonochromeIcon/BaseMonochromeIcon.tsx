import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const BaseMonochromeIcon: React.FC<Props> = ({ width = 17.89, height = 17.89 }) => (
  <Svg width={width} height={height} viewBox="0 0 17.89 17.89">
    <Path
      d="M8.929,17.89A8.945,8.945,0,1,0,0,8.193H11.844V9.7H0A8.956,8.956,0,0,0,8.929,17.89Z"
      fill="#51588c"
    />
  </Svg>
)

export default BaseMonochromeIcon

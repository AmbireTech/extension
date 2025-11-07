import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const DragIndicatorIcon: React.FC<SvgProps> = ({ width = 12.5, height = 20, color }) => (
  <Svg width={width} height={height} viewBox="0 0 12.5 20">
    <Path
      d="M15.5,23.5A2.5,2.5,0,1,1,13,21,2.507,2.507,0,0,1,15.5,23.5ZM13,13.5A2.5,2.5,0,1,0,15.5,16,2.507,2.507,0,0,0,13,13.5ZM13,6a2.5,2.5,0,1,0,2.5,2.5A2.507,2.507,0,0,0,13,6Zm7.5,5A2.5,2.5,0,1,0,18,8.5,2.507,2.507,0,0,0,20.5,11Zm0,2.5A2.5,2.5,0,1,0,23,16,2.507,2.507,0,0,0,20.5,13.5Zm0,7.5A2.5,2.5,0,1,0,23,23.5,2.507,2.507,0,0,0,20.5,21Z"
      transform="translate(-10.5 -6)"
      fill={color}
    />
  </Svg>
)

export default React.memo(DragIndicatorIcon)

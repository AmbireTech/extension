import React from 'react'
import Svg, { Circle, G, Path, SvgProps } from 'react-native-svg'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const BaseLogo: React.FC<Props> = ({ width = 32, height = 32, ...rest }) => (
  <Svg width={width} height={height} viewBox="0 0 32 32" {...rest}>
    <G transform="translate(-627 -433)">
      <Circle cx="10" cy="10" r="10" transform="translate(633 439)" fill="#2151f5" />
      <Path
        d="M6.988,14A7,7,0,1,0,0,6.411H9.269V7.589H0A7.008,7.008,0,0,0,6.988,14Z"
        transform="translate(636 442)"
        fill="#fff"
      />
    </G>
  </Svg>
)

export default BaseLogo

import React from 'react'
import Svg, { Circle, G, Path, Rect, SvgProps } from 'react-native-svg'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const OptimismLogo: React.FC<Props> = ({ width = 32, height = 32, ...rest }) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 32 32"
    {...rest}
  >
    <G data-name="OP Mainnet icon new">
      <Path
        data-name="Path 17765"
        d="M0 9a9 9 0 119 9 9 9 0 01-9-9z"
        transform="translate(24045 11226) translate(-24038 -11219)"
        fill="#fff"
      />
      <Path
        data-name="Path 17766"
        d="M9 0a9 9 0 109 9 9 9 0 00-9-9zm0 13.582v3.758A6.462 6.462 0 019 4.418V.659a6.462 6.462 0 110 12.923zm3.1-4.611v.058a6.667 6.667 0 00-3.07 3.07h-.059A6.667 6.667 0 005.9 9.029v-.058A6.667 6.667 0 008.971 5.9h.058A6.666 6.666 0 0012.1 8.971z"
        transform="translate(24045 11226) translate(-24038 -11219)"
        fill="#ff0420"
      />
    </G>
  </Svg>
)

export default OptimismLogo

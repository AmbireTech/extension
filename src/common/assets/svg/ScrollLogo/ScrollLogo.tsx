import React from 'react'
import Svg, { Circle, G, Path, Rect, SvgProps } from 'react-native-svg'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const ScrollLogo: React.FC<Props> = ({ width = 32, height = 32, ...rest }) => (
  <Svg width={width} height={height} viewBox="0 0 32 32" {...rest}>
    <Rect
      width="32"
      height="32"
      rx="12"
      transform="translate(0 32) rotate(-90)"
      fill="#1e2033"
      opacity="0"
    />
    <G transform="translate(-282.856 -63.857)">
      <G transform="translate(289.712 70.857)">
        <Path
          d="M2.283,6.938a3.483,3.483,0,0,1-1.2-2.549V4.278A3.334,3.334,0,0,1,4.3,1.086H15.362a.516.516,0,0,1,.51.51v9.377a6.348,6.348,0,0,1,.621.155,3.132,3.132,0,0,1,.466.222V1.6A1.623,1.623,0,0,0,15.34,0H4.3A4.381,4.381,0,0,0,0,4.389,4.329,4.329,0,0,0,1.663,7.8.391.391,0,0,0,2,7.936.511.511,0,0,0,2.527,7.4.522.522,0,0,0,2.283,6.938Z"
          transform="translate(0 0)"
          fill="#fff"
        />
        <Path
          d="M24.258,23.346H15.591a1.046,1.046,0,0,0-1.042,1.064v1.241a1.114,1.114,0,0,0,1.086,1.064h.643V25.652h-.643V24.433h.355A2.04,2.04,0,0,1,17.9,26.538a2.185,2.185,0,0,1-4.367,0V15.965a.88.88,0,0,0-.865-.865H11.8v1.086h.643V26.561a2.97,2.97,0,0,0,3.1,3.17l8.734.022a3.193,3.193,0,0,0,3.192-3.192A3.231,3.231,0,0,0,24.258,23.346ZM26.364,26.6a2.121,2.121,0,0,1-2.106,2.039l-6.074-.022a3.14,3.14,0,0,0,.776-2.084,3.538,3.538,0,0,0-.732-2.106H24.28a2.119,2.119,0,0,1,2.106,2.106Z"
          transform="translate(-9.184 -11.753)"
          fill="#fff"
        />
        <Path
          d="M34.539,17.064H28V16h6.539a.539.539,0,0,1,.532.532A.525.525,0,0,1,34.539,17.064Z"
          transform="translate(-21.793 -12.453)"
          fill="#fff"
        />
        <Path
          d="M34.539,39.986H28V38.9h6.539a.539.539,0,0,1,.532.532A.531.531,0,0,1,34.539,39.986Z"
          transform="translate(-21.793 -30.277)"
          fill="#fff"
        />
        <Path
          d="M35.692,28.486H28V27.4h7.692a.543.543,0,0,1,0,1.086Z"
          transform="translate(-21.793 -21.326)"
          fill="#fff"
        />
      </G>
    </G>
  </Svg>
)

export default ScrollLogo

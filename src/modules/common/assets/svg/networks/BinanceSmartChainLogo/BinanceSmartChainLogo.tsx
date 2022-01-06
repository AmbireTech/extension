import React from 'react'
import Svg, { Path, Polygon, SvgProps } from 'react-native-svg'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const BinanceSmartChainLogo: React.FC<Props> = ({ width = 18, height = 18, ...rest }) => (
  <Svg width={width} height={height} viewBox="0 0 2500.01 2500" {...rest}>
    <Path
      fill="#f3ba2f"
      d="M764.48,1050.52,1250,565l485.75,485.73,282.5-282.5L1250,0,482,768l282.49,282.5M0,1250,282.51,967.45,565,1249.94,282.49,1532.45Zm764.48,199.51L1250,1935l485.74-485.72,282.65,282.35-.14.15L1250,2500,482,1732l-.4-.4,282.91-282.12M1935,1250.12l282.51-282.51L2500,1250.1,2217.5,1532.61Z"
    />
    <Path
      fill="#f3ba2f"
      d="M1536.52,1249.85h.12L1250,963.19,1038.13,1175h0l-24.34,24.35-50.2,50.21-.4.39.4.41L1250,1536.81l286.66-286.66.14-.16-.26-.14"
    />
  </Svg>
)

export default BinanceSmartChainLogo

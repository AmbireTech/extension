import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const MoonbeamLogo: React.FC<Props> = ({ width = 32, height = 32, ...rest }) => (
  <Svg width={width} height={height} viewBox="0 0 32 32" {...rest}>
    <Path
      d="M19.978 16.144a5.326 5.326 0 0 1-1.929-.378 7.658 7.658 0 0 1-2.016-1.2 5.352 5.352 0 0 0-3.4-1.164 5.775 5.775 0 0 0-4.016 1.555 7.436 7.436 0 0 1 .006-2.936 7.323 7.323 0 0 1 1.108-2.633 7.385 7.385 0 0 1 3.24-2.668 7.327 7.327 0 0 1 1.38-.426 7.435 7.435 0 0 1 2.968 0 7.323 7.323 0 0 1 2.633 1.108 7.385 7.385 0 0 1 2.668 3.242 7.326 7.326 0 0 1 .429 1.382 7.436 7.436 0 0 1 0 2.952 4.649 4.649 0 0 1-3.071 1.166Z"
      fill="#f2b705"
    />
    <Path
      d="M12.654 25.379v-8.716a.476.476 0 0 1 .952 0v8.716a.476.476 0 0 1-.952 0Zm5.41-1.8v-4.411a.476.476 0 1 1 .952 0v4.408a.476.476 0 0 1-.952 0Zm1.8-.5v-3.711a.476.476 0 0 1 .952 0v3.707a.476.476 0 0 1-.952 0Zm-9.013-1.957v-4.358a.476.476 0 1 1 .952 0v4.358a.476.476 0 1 1-.952 0Zm-1.8-.3v-3.107a.476.476 0 1 1 .952 0v3.106a.476.476 0 0 1-.952 0Zm12.623-.3v-1.6a.476.476 0 0 1 .952 0v1.6a.476.476 0 1 1-.952 0Zm-7.213 0v-3.107a.476.476 0 0 1 .952 0v3.106a.476.476 0 1 1-.952 0Zm1.8-1.252v-.753a.476.476 0 1 1 .952 0v.751a.476.476 0 1 1-.952 0Zm-.353-2.9a5.477 5.477 0 0 0-6.9.273.426.426 0 0 1-.615-.591 6.289 6.289 0 0 1 8.036-.354c2.276 1.761 4.5 1.864 6.621.307a.426.426 0 0 1 .5.686 5.938 5.938 0 0 1-3.547 1.261 6.717 6.717 0 0 1-4.095-1.58Z"
      fill="#53cbc8"
    />
  </Svg>
)

export default MoonbeamLogo

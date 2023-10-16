import React from 'react'
import Svg, { Circle, G, Path, Rect, SvgProps } from 'react-native-svg'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const SepoliaLogo: React.FC<Props> = ({ width = 32, height = 32, ...rest }) => (
  <Svg width={width} height={height} viewBox="0 0 32 32" {...rest}>
    <Rect width="32" height="32" fill="#627eea" opacity="0" />
    <Circle cx="10" cy="10" r="10" transform="translate(6 6)" fill="#627eea" />
    <G transform="translate(1.756 3.611)">
      <Path
        d="M16.5,4v6.2l5.242,2.342Z"
        transform="translate(-2.255)"
        fill="rgba(255,255,255,0.6)"
      />
      <Path d="M14.243,4,9,12.545,14.243,10.2Z" fill="#fff" />
      <Path
        d="M16.5,20.659v4.214l5.246-7.257Z"
        transform="translate(-2.255 -4.095)"
        fill="rgba(255,255,255,0.6)"
      />
      <Path d="M14.243,24.873V20.658L9,17.616Z" transform="translate(0 -4.095)" fill="#fff" />
      <Path
        d="M16.5,18.257l5.242-3.044L16.5,12.872Z"
        transform="translate(-2.255 -2.668)"
        fill="rgba(255,255,255,0.2)"
      />
      <Path
        d="M9,15.213l5.243,3.044V12.872Z"
        transform="translate(0 -2.668)"
        fill="rgba(255,255,255,0.6)"
      />
    </G>
  </Svg>
)

export default SepoliaLogo

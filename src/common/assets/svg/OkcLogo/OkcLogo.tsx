import React from 'react'
import Svg, { Circle, G, Path, Rect, SvgProps } from 'react-native-svg'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const OkcLogo: React.FC<Props> = ({ width = 32, height = 32, ...rest }) => (
  <Svg width={width} height={height} viewBox="0 0 32 32" {...rest}>
    <G transform="translate(-627 -433)">
      <Rect
        width="32"
        height="32"
        rx="12"
        transform="rotate(-90 546 -81)"
        fill="#ebecff"
        opacity=".05"
      />
      <Circle data-name="Ellipse 272" cx="10" cy="10" r="10" transform="translate(633 439)" />
      <Path
        fill="#fff"
        d="M637.019 442.707h3.6a.311.311 0 0 1 .311.311v3.6a.311.311 0 0 1-.311.311h-3.6a.311.311 0 0 1-.311-.309v-3.602a.311.311 0 0 1 .311-.311Z"
      />
      <Path
        fill="#fff"
        d="M641.199 446.886h3.6a.311.311 0 0 1 .311.311v3.6a.311.311 0 0 1-.311.311h-3.6a.311.311 0 0 1-.311-.309v-3.602a.311.311 0 0 1 .311-.311Z"
      />
      <Path
        fill="#fff"
        d="M637.019 451.066h3.6a.311.311 0 0 1 .311.311v3.6a.311.311 0 0 1-.311.311h-3.6a.311.311 0 0 1-.311-.309v-3.602a.311.311 0 0 1 .311-.311Z"
      />
      <Path
        fill="#fff"
        d="M645.379 442.707h3.6a.311.311 0 0 1 .311.311v3.6a.311.311 0 0 1-.311.311h-3.6a.311.311 0 0 1-.311-.309v-3.602a.311.311 0 0 1 .311-.311Z"
      />
      <Path
        fill="#fff"
        d="M645.379 451.066h3.6a.311.311 0 0 1 .311.311v3.6a.311.311 0 0 1-.311.311h-3.6a.311.311 0 0 1-.311-.309v-3.602a.311.311 0 0 1 .311-.311Z"
      />
    </G>
  </Svg>
)

export default OkcLogo

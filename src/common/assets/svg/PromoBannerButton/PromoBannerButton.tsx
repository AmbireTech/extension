import React from 'react'
import Svg, { Defs, LinearGradient, Path, Stop, SvgProps } from 'react-native-svg'

interface Props extends SvgProps {}

const PromoBannerButton: React.FC<Props> = ({ width = 43, height = 48, color, ...rest }) => (
  <Svg width={width} height={height} viewBox="0 0 43 48" {...rest}>
    <Defs>
      <LinearGradient
        id="a"
        x1=".881"
        y1=".008"
        x2=".108"
        y2=".927"
        gradientUnits="objectBoundingBox"
      >
        <Stop offset="0" stopColor={color || '#27e8a7'} />
        <Stop offset="1" stopColor={color || '#ae60ff'} />
      </LinearGradient>
    </Defs>
    <Path d="M13 5h30v38H13a8 8 0 0 1-8-8V13a8 8 0 0 1 8-8Z" fill="#1e2033" />
    <Path
      d="M-3774 57h-31a11.921 11.921 0 0 1-8.485-3.515A11.922 11.922 0 0 1-3817 45V21a11.922 11.922 0 0 1 3.515-8.485A11.921 11.921 0 0 1-3805 9h31v2.5h-31a9.511 9.511 0 0 0-9.5 9.5v24a9.511 9.511 0 0 0 9.5 9.5h31V57Z"
      transform="translate(3817 -9)"
      fill="url(#a)"
    />
  </Svg>
)

export default React.memo(PromoBannerButton)

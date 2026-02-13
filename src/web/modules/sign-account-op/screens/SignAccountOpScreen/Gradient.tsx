import React from 'react'
import Svg, {
  Defs,
  FeBlend,
  FeFlood,
  FeGaussianBlur,
  Filter,
  G,
  Path,
  SvgProps
} from 'react-native-svg'

const FooterGradient = (props: SvgProps) => {
  return (
    <Svg width="617" height="392" viewBox="0 0 617 392" fill="none" {...props}>
      <G opacity="0.23" filter="url(#filter0_f_1488_32059)">
        <Path
          d="M526.806 183.34C526.806 236.841 536.466 318.388 514.288 301.686C308.642 115.101 221.021 139.915 111.214 114.146C1.40775 88.3776 309.997 90.7636 403.48 87.9004C521.298 87.9004 526.806 103.648 526.806 183.34Z"
          fill="#9D7AFF"
        />
      </G>
      <Defs>
        <Filter
          id="filter0_f_1488_32059"
          x="2.28882e-05"
          y="0.000389099"
          width="616.8"
          height="391.8"
          filterUnits="userSpaceOnUse"
          // colorInterpolationFilters="sRGB"
        >
          <FeFlood floodOpacity="0" result="BackgroundImageFix" />
          <FeBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <FeGaussianBlur stdDeviation="43.95" result="effect1_foregroundBlur_1488_32059" />
        </Filter>
      </Defs>
    </Svg>
  )
}

export default React.memo(FooterGradient)

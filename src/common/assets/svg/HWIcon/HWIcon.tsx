import React from 'react'
import Svg, { Circle, G, Path, Rect, SvgProps } from 'react-native-svg'

import colors from '@common/styles/colors'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const HWIcon: React.FC<Props> = ({ width = 64, height = 64 }) => (
  <Svg width={width} height={height} viewBox="0 0 64 64">
    <G transform="translate(16858.15 -419.551)">
      <G transform="translate(-16858.15 451.52) rotate(-9)">
        <G transform="translate(0 0)" fill="none" stroke={colors.titan} strokeWidth="1.5">
          <Rect width="61.211" height="18.629" rx="2" stroke="none" />
          <Rect x="0.75" y="0.75" width="59.711" height="17.129" rx="1.25" fill="none" />
        </G>
        <G
          transform="matrix(1, 0, 0, 1, 46.611, 3.992)"
          fill="none"
          stroke={colors.titan}
          strokeWidth="1.5"
        >
          <Circle cx="5.323" cy="5.323" r="5.323" stroke="none" />
          <Circle cx="5.323" cy="5.323" r="4.573" fill="none" />
        </G>
        <G transform="translate(6.653 3.992)" fill="none" stroke={colors.titan} strokeWidth="1.5">
          <Rect width="25.601" height="9.645" rx="2" stroke="none" />
          <Rect x="0.75" y="0.75" width="24.101" height="8.145" rx="1.25" fill="none" />
        </G>
      </G>
      <G transform="translate(-16853.543 431) rotate(14)">
        <G transform="translate(0 0)" fill="#24263d" stroke={colors.titan} strokeWidth="1.5">
          <Path
            d="M1.863,0H51.9a9.315,9.315,0,0,1,9.315,9.315v0A9.315,9.315,0,0,1,51.9,18.629H1.863A1.863,1.863,0,0,1,0,16.766V1.863A1.863,1.863,0,0,1,1.863,0Z"
            stroke="none"
          />
          <Path
            d="M2.2.75H51.9a8.565,8.565,0,0,1,8.565,8.565v0A8.565,8.565,0,0,1,51.9,17.879H2.2A1.446,1.446,0,0,1,.75,16.433V2.2A1.446,1.446,0,0,1,2.2.75Z"
            fill="none"
          />
        </G>
        <G
          transform="matrix(1, 0, 0, 1, 46.611, 3.992)"
          fill="none"
          stroke={colors.titan}
          strokeWidth="1.5"
        >
          <Circle cx="5.323" cy="5.323" r="5.323" stroke="none" />
          <Circle cx="5.323" cy="5.323" r="4.573" fill="none" />
        </G>
      </G>
    </G>
  </Svg>
)

export default HWIcon

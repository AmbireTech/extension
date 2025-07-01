import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

const PendingToBeConfirmedIcon: React.FC<SvgProps> = ({ width = 24, height = 24 }) => (
  <Svg width={width} height={height} viewBox="0 0 20 20">
    <G transform="translate(-2 -2)">
      <G fill="none" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M22,12A10,10,0,1,1,12,2,10,10,0,0,1,22,12Z" stroke="none" />
        <Path
          d="M 12 3.200000762939453 C 7.147659301757812 3.200000762939453 3.200000762939453 7.147659301757812 3.200000762939453 12 C 3.200000762939453 16.85234069824219 7.147659301757812 20.79999923706055 12 20.79999923706055 C 16.85234069824219 20.79999923706055 20.79999923706055 16.85234069824219 20.79999923706055 12 C 20.79999923706055 7.147659301757812 16.85234069824219 3.200000762939453 12 3.200000762939453 M 12 2 C 17.52000045776367 2 22 6.479999542236328 22 12 C 22 17.52000045776367 17.52000045776367 22 12 22 C 6.479999542236328 22 2 17.52000045776367 2 12 C 2 6.479999542236328 6.479999542236328 2 12 2 Z"
          stroke="none"
          fill="#0F71DD"
        />
      </G>
      <Path
        d="M15.71,15.18l-3.1-1.85a2.215,2.215,0,0,1-.98-1.72V7.51"
        fill="none"
        stroke="#0F71DD"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </G>
  </Svg>
)

export default React.memo(PendingToBeConfirmedIcon)

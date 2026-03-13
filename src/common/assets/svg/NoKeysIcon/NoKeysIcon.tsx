import React, { FC } from 'react'
import { G, Path, Rect, Svg, SvgProps } from 'react-native-svg'

const NoKeysIcon: FC<SvgProps> = ({ width = 20, height = 21, color = '#fff' }) => {
  return (
    <Svg viewBox="0 0 20.075 21.229" width={width} height={height}>
      <G fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
        <Path d="M17.567 14.845a6.023 6.023 0 0 1-6.045 1.487l-3.743 3.737a1.539 1.539 0 0 1-1.185.39l-1.733-.239a1.5 1.5 0 0 1-1.193-1.193l-.239-1.733a1.6 1.6 0 0 1 .39-1.185l3.737-3.736a6.02 6.02 0 1 1 10.01 2.473Z" />
        <Path d="m7.31 16.881 1.829 1.829" />
        <Path d="M13.36 12.279a1.748 1.748 0 1 0-1.748-1.752 1.748 1.748 0 0 0 1.748 1.752Z" />
      </G>
      <Rect width="12" height="12" rx="6" transform="rotate(180 6 6)" fill="#ea0129" />
      <G transform="rotate(180 4.5 4.5)" fill="none" stroke="#fff">
        <Rect width="6" height="6" rx="3" stroke="none" />
        <Rect x="-.5" y="-.5" width="7" height="7" rx="3.5" />
      </G>
      <Path fill="none" stroke="#fff" strokeLinecap="round" d="M8.366 3.63 3.75 8.25" />
    </Svg>
  )
}

export default React.memo(NoKeysIcon)

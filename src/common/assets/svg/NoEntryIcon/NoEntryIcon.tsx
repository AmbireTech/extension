import React from 'react'
import Svg, { Circle, Path, SvgProps } from 'react-native-svg'

const NoEntryIcon: React.FC<SvgProps> = ({ width = 18, height = 18, ...props }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle
        cx="9"
        cy="9"
        r="9"
        transform="matrix(-1 0 0 1 21 3)"
        stroke="#96A1B1"
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <Path d="M6 18L18.7279 5.27208" stroke="#96A1B1" stroke-width="1.5" />
    </Svg>
  )
}

export default React.memo(NoEntryIcon)

import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const ChevronRight = (props: SvgProps) => {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
      <Path d="M9.5 17L14.5 12L9.5 7" stroke="#2F3346" strokeWidth="3" strokeLinecap="round" />
    </Svg>
  )
}

export default ChevronRight

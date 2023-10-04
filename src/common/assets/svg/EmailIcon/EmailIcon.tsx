import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import colors from '@common/styles/colors'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const EmailIcon: React.FC<Props> = ({ width = 64, height = 64 }) => (
  <Svg width={width} height={height} viewBox="0 0 64 64">
    <G transform="translate(10.662 15.996)">
      <Path
        d="M41.409,6H7.268a4.134,4.134,0,0,0-4.246,4L3,34.007a4.153,4.153,0,0,0,4.268,4H41.409a4.153,4.153,0,0,0,4.268-4V10A4.153,4.153,0,0,0,41.409,6Z"
        transform="translate(-3 -6)"
        fill="none"
        stroke={colors.titan}
        strokeWidth="1.5"
      />
      <Path
        d="M-4074.472-21252.465v4.295l17.175,10.479,16.966-10.762v-4.012l-16.966,10.453Z"
        transform="translate(4078.74 21256.67)"
        fill="none"
        stroke={colors.titan}
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </G>
  </Svg>
)

export default EmailIcon

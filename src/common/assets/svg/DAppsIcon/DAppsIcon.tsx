import React from 'react'
import { ColorValue } from 'react-native'
import Svg, { G, Rect, SvgProps } from 'react-native-svg'

import colors from '@common/styles/colors'

interface Props extends SvgProps {
  width?: number
  height?: number
  color?: ColorValue
}

const DAppsIcon: React.FC<Props> = ({ width = 18, height = 18, color }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24">
    <G transform="translate(-769.335 389.665)">
      <G transform="translate(769.335 -389.665)">
        <G transform="translate(0)" fill="none" stroke={color || colors.titan} strokeWidth="2">
          <Rect width="11.294" height="11.294" rx="2" stroke="none" />
          <Rect x="1" y="1" width="9.294" height="9.294" rx="1" fill="none" />
        </G>
        <G
          transform="translate(0 12.706)"
          fill="none"
          stroke={color || colors.titan}
          strokeWidth="2"
        >
          <Rect width="11.294" height="11.294" rx="2" stroke="none" />
          <Rect x="1" y="1" width="9.294" height="9.294" rx="1" fill="none" />
        </G>
        <G transform="translate(12.706)" fill="none" stroke={color || colors.titan} strokeWidth="2">
          <Rect width="11.294" height="11.294" rx="2" stroke="none" />
          <Rect x="1" y="1" width="9.294" height="9.294" rx="1" fill="none" />
        </G>
        <G
          transform="translate(12.706 12.706)"
          fill="none"
          stroke={color || colors.titan}
          strokeWidth="2"
        >
          <Rect width="11.294" height="11.294" rx="2" stroke="none" />
          <Rect x="1" y="1" width="9.294" height="9.294" rx="1" fill="none" />
        </G>
      </G>
    </G>
  </Svg>
)

export default DAppsIcon

import React from 'react'
import Svg, { G, Path, Rect, SvgProps } from 'react-native-svg'

import colors from '@common/styles/colors'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const SortIcon: React.FC<Props> = ({ width = 24, height = 24 }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24">
    <G transform="translate(-345 -141)">
      <Rect width="24" height="24" transform="translate(345 141)" fill="none" />
      <Path
        d="M28.5,26.944h-8V23.954h8ZM28.5,9v2.991H4.5V9Zm0,10.468h-16V16.477h16Z"
        transform="translate(340.5 135)"
        fill={colors.titan}
      />
    </G>
  </Svg>
)

export default SortIcon

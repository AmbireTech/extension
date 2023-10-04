import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import colors from '@common/styles/colors'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const SearchIcon: React.FC<Props> = ({ width = 18, height = 18 }) => (
  <Svg width={width} height={height} viewBox="0 0 18 18">
    <Path
      d="M17.364,15.821h-.813l-.288-.278a6.7,6.7,0,1,0-.72.72l.278.288v.813L20.967,22.5,22.5,20.967Zm-6.175,0a4.631,4.631,0,1,1,4.631-4.631A4.625,4.625,0,0,1,11.19,15.821Z"
      transform="translate(-4.5 -4.5)"
      fill={colors.titan}
    />
  </Svg>
)

export default SearchIcon

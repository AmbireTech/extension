import React from 'react'
import Svg, { G, Path, Rect, SvgProps } from 'react-native-svg'

import colors from '@common/styles/colors'

interface Props extends SvgProps {
  withRect?: boolean
  width?: number
  height?: number
  color?: string
}

const RightArrowIcon: React.FC<Props> = ({
  width = 40,
  height = 40,
  withRect = true,
  color = colors.titan,
  ...rest
}) => (
  <Svg width={width} height={height} viewBox="0 0 40 40" {...rest}>
    <G transform="translate(32 8) rotate(90)">
      {withRect && (
        <Rect
          width="40"
          height="40"
          rx="13"
          transform="translate(-8 -8)"
          fill={color}
          opacity="0.05"
        />
      )}
      <Path
        d="M6,0H6L5.293.707l-5,5A1,1,0,0,0,1.707,7.121L3,5.828l3-3L7.262,4.091,9,5.828l1.293,1.292a1,1,0,0,0,1.414-1.414L10.414,4.415h0L8.677,2.676,6.708.707,6.686.685,6,0Z"
        transform="translate(6 7.586)"
        fill={color}
      />
    </G>
  </Svg>
)

export default RightArrowIcon

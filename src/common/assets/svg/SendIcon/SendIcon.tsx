import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import colors from '@common/styles/colors'

interface Props extends SvgProps {
  color?: string
}

const SendIcon: React.FC<Props> = ({
  width = 18,
  height = 13.28,
  color = colors.titan,
  ...rest
}) => (
  <Svg width={width} height={height} viewBox="0 0 12.954 9.559" {...rest}>
    <Path
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeWidth="1.5"
      d="m5.517 8.499 6.688-6.688v5.78"
    />
    <Path
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeWidth="1.5"
      d="m1.061 8.473 6.688-6.688h-5.78"
    />
  </Svg>
)

export default SendIcon

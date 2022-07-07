import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import colors from '@modules/common/styles/colors'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const LogOutIcon: React.FC<Props> = ({ width = 24, height = 24 }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24">
    <Path fill="none" d="M0 0h24v24H0z" />
    <Path
      d="m15.792 17.708 1.293-1.293 1.738-1.738 1.969-1.968.022-.023.685-.685-.707-.707-5-5a1 1 0 1 0-1.414 1.414l1.293 1.293 2.094 2.093H8.453a1 1 0 0 0 0 2h9.124l-.168.168-1.738 1.739-1.293 1.293a1 1 0 1 0 1.414 1.414Z"
      fill={colors.titan}
    />
    <Path
      d="M5.527 22.994h11.5v-2h-11.5a1 1 0 0 1-1-1L4.501 4a1 1 0 0 1 1-1h11.5V1h-11.5a3 3 0 0 0-3 3l.026 15.994a3 3 0 0 0 3 3Z"
      fill={colors.titan}
    />
  </Svg>
)

export default LogOutIcon

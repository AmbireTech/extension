import React, { FC } from 'react'
import { Path, Svg, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const BulbIcon: FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} {...rest} viewBox="0 0 14.201 19.644">
      <Path
        d="M11.129,20.237a.91.91,0,0,0,.907.907h3.629a.91.91,0,0,0,.907-.907v-.907H11.129ZM13.85,3a6.348,6.348,0,0,0-3.629,11.558v2.05a.91.91,0,0,0,.907.907h5.443a.91.91,0,0,0,.907-.907v-2.05A6.348,6.348,0,0,0,13.85,3Z"
        transform="translate(-6.75 -2.25)"
        fill="none"
        stroke={color || theme.primary}
        strokeWidth="1.5"
      />
    </Svg>
  )
}

export default React.memo(BulbIcon)

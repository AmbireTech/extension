import React, { FC } from 'react'
import { Path, Svg, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const StarFilledIcon: FC<SvgProps> = ({ color, width = 16, height = 16, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 16 16" {...rest}>
      <Path
        d="M7.115,1.685a1,1,0,0,1,1.77,0L10.419,4.6a1,1,0,0,0,.686.515l3.191.647a1,1,0,0,1,.548,1.645L12.57,9.968a1,1,0,0,0-.246.782l.4,3.423a1,1,0,0,1-1.435,1.015l-2.852-1.4a1,1,0,0,0-.883,0l-2.852,1.4a1,1,0,0,1-1.435-1.015l.4-3.423a1,1,0,0,0-.246-.782L1.155,7.41A1,1,0,0,1,1.7,5.766l3.191-.647A1,1,0,0,0,5.581,4.6Z"
        fill={color || theme.iconPrimary}
      />
    </Svg>
  )
}

export default React.memo(StarFilledIcon)

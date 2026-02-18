import React, { FC } from 'react'
import { Path, Svg, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const FeeIcon: FC<SvgProps> = ({ color, width, height, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 20 20" {...rest} fill="none">
      <Path
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        d="M10 18a8.008 8.008 0 0 1-8-8 8.01 8.01 0 0 1 8-8 8.01 8.01 0 0 1 8 8 8.008 8.008 0 0 1-8 8Zm.187-12.507a.2.2 0 0 0-.374 0L8.657 8.541a.2.2 0 0 1-.116.116L5.493 9.813a.2.2 0 0 0 0 .374l3.048 1.155a.2.2 0 0 1 .116.116l1.156 3.049a.2.2 0 0 0 .374 0l1.155-3.048a.2.2 0 0 1 .116-.116l3.049-1.156a.2.2 0 0 0 0-.374l-3.048-1.156a.2.2 0 0 1-.116-.116l-1.156-3.048Z"
      />
    </Svg>
  )
}

export default React.memo(FeeIcon)

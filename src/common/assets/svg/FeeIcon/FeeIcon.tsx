import React, { FC } from 'react'
import { Path, Svg, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const FeeIcon: FC<SvgProps> = ({ color, width, height, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 16 16" {...rest}>
      <Path
        d="M8 16a8.008 8.008 0 0 1-8-8 8.01 8.01 0 0 1 8-8 8.009 8.009 0 0 1 8 8 8.008 8.008 0 0 1-8 8ZM8 3 6.625 6.625 3 8l3.625 1.374L8 13l1.374-3.625L13 8 9.375 6.625 8 3Z"
        fill={color || theme.iconSecondary}
      />
    </Svg>
  )
}

export default React.memo(FeeIcon)

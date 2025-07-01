import React, { FC } from 'react'
import { Path, Svg, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const FilterIcon: FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg fill="none" viewBox="0 0 24 24" width={width} height={height} {...rest}>
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit="10"
        strokeWidth="1.5"
        d="M5.4 2.1h13.2c1.1 0 2 .9 2 2v2.2c0 .8-.5 1.8-1 2.3l-4.3 3.8c-.6.5-1 1.5-1 2.3V19c0 .6-.4 1.4-.9 1.7l-1.4.9c-1.3.8-3.1-.1-3.1-1.7v-5.3c0-.7-.4-1.6-.8-2.1l-3.8-4c-.5-.5-.9-1.4-.9-2V4.2c0-1.2.9-2.1 2-2.1Zm5.53 0L6 10"
      />
    </Svg>
  )
}

export default React.memo(FilterIcon)

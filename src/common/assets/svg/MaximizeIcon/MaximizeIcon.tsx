import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const MaximizeIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg viewBox="0 0 18.121 18.121" width={width} height={height} {...rest}>
      <G fill="none" stroke={color || theme.iconSecondary} strokeLinecap="round" strokeWidth="1.5">
        <Path d="M7.255 10.917 1.061 17.06" />
        <Path d="m17.061 1.06-6.194 6.143" />
        <Path d="M1.061 12.792v4.267h4.283" strokeLinejoin="round" />
        <Path d="M17.059 5.327V1.06h-4.284" strokeLinejoin="round" />
      </G>
    </Svg>
  )
}

export default React.memo(MaximizeIcon)

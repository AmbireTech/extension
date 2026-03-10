import React, { FC } from 'react'
import Svg, { Circle, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const NotConnected: FC<{ style?: SvgProps['style']; isBlacklisted: boolean }> = ({
  style,
  isBlacklisted
}) => {
  const { theme } = useTheme()

  return (
    <Svg width="10" height="10" viewBox="0 0 8 8" fill="none" style={style}>
      <Circle
        cx="4"
        cy="4"
        r="3.5"
        fill={isBlacklisted ? theme.errorDecorative : theme.neutral700}
        stroke={theme.primaryBackground}
        strokeLinecap="round"
      />
      <Path d="M5.5 5.5L2.5 2.5" stroke="white" />
      <Path d="M2.5 5.5L5.5 2.5" stroke="white" />
    </Svg>
  )
}

export default React.memo(NotConnected)

import React, { FC } from 'react'
import Svg, { Circle, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const NotConnected: FC<{ style?: SvgProps['style']; isBlacklisted: boolean }> = ({
  style,
  isBlacklisted
}) => {
  const { theme } = useTheme()

  return (
    <Svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={style}>
      <Circle cx="4" cy="4" r="4" fill={isBlacklisted ? theme.errorDecorative : theme.neutral600} />
      <Path d="M6 6L2 2" stroke="white" />
      <Path d="M2 6L6 2" stroke="white" />
    </Svg>
  )
}

export default React.memo(NotConnected)

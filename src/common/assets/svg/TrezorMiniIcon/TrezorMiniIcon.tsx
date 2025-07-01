import React from 'react'
import Svg, { Circle, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const TrezorMiniIcon: React.FC<SvgProps> = ({ width = 32, height = 32, ...styles }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 32 32" {...styles}>
      <Circle cx="16" cy="16" r="16" fill={theme.secondaryBackgroundInverted} />
      <Path fill="none" d="M0 0h32v32H0z" />
      <Path
        d="M8.997 22.449V11.694h2.107v-1.317a4.928 4.928 0 1 1 9.857 0v1.317h2.031v10.755l-6.966 3.316Zm2.784-1.766 4.24 2 4.187-1.991v-6.214h-8.427Zm6.7-8.994v-1.312a2.446 2.446 0 1 0-4.891 0v1.317Z"
        fill={theme.primaryBackground}
      />
    </Svg>
  )
}

export default React.memo(TrezorMiniIcon)

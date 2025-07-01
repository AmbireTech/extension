import React, { FC } from 'react'
import { G, Path, Svg, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const RejectedIcon: FC<SvgProps> = ({ color, width = 32, height = 32, ...props }) => {
  const { theme } = useTheme()
  return (
    <Svg viewBox="0 0 18 18" width={width} height={height} {...props}>
      <G>
        <G strokeLinecap="round" strokeLinejoin="round">
          <G fill={color || theme.iconSecondary}>
            <Path d="M9 17.25a8.19 8.19 0 0 1-5.826-2.424A8.19 8.19 0 0 1 .75 9a8.19 8.19 0 0 1 2.424-5.826A8.19 8.19 0 0 1 9 .75a8.19 8.19 0 0 1 5.826 2.424A8.19 8.19 0 0 1 17.25 9a8.19 8.19 0 0 1-2.424 5.826A8.19 8.19 0 0 1 9 17.25Z" />
            <Path d="M9 16.5a7.446 7.446 0 0 0 5.296-2.204A7.446 7.446 0 0 0 16.5 9a7.446 7.446 0 0 0-2.204-5.296A7.446 7.446 0 0 0 9 1.5a7.446 7.446 0 0 0-5.296 2.204A7.446 7.446 0 0 0 1.5 9c0 1.993.783 3.874 2.204 5.296A7.446 7.446 0 0 0 9 16.5M9 18c-4.95 0-9-4.05-9-9s4.05-9 9-9 9 4.05 9 9-4.05 9-9 9Z" />
          </G>
          <Path d="m5.5 12.5 7-7" fill="none" stroke="#fff" strokeWidth="1.5" />
          <Path d="m12.5 12.5-7-7" fill="none" stroke="#fff" strokeWidth="1.5" />
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(RejectedIcon)

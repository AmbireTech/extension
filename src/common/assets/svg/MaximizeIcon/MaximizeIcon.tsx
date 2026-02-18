import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const MaximizeIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()

  return (
    <Svg viewBox="0 0 24 24" width={width} height={height} {...rest} fill="none">
      <Path
        d="M4 20H3.25V20.75H4V20ZM9.53033 15.5303C9.82322 15.2374 9.82322 14.7626 9.53033 14.4697C9.23744 14.1768 8.76256 14.1768 8.46967 14.4697L9 15L9.53033 15.5303ZM4 14H3.25V20H4H4.75V14H4ZM4 20V20.75H10V20V19.25H4V20ZM4 20L4.53033 20.5303L9.53033 15.5303L9 15L8.46967 14.4697L3.46967 19.4697L4 20Z"
        fill={color || theme.iconPrimary}
      />
      <Path
        d="M20 4H20.75V3.25H20V4ZM14.4697 8.46967C14.1768 8.76256 14.1768 9.23744 14.4697 9.53033C14.7626 9.82322 15.2374 9.82322 15.5303 9.53033L15 9L14.4697 8.46967ZM20 10H20.75V4H20H19.25V10H20ZM20 4V3.25H14V4V4.75H20V4ZM20 4L19.4697 3.46967L14.4697 8.46967L15 9L15.5303 9.53033L20.5303 4.53033L20 4Z"
        fill={color || theme.iconPrimary}
      />
    </Svg>
  )
}

export default React.memo(MaximizeIcon)

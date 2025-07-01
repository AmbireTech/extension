import React, { FC } from 'react'
import { Path, Svg, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const AccountsFilledIcon: FC<SvgProps> = ({ width, height, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 16.034 16" {...rest}>
      <Path
        d="M5.632 0a3.8 3.8 0 0 0-.1 7.592.645.645 0 0 1 .176 0h.056A3.8 3.8 0 0 0 5.632 0Z"
        fill={color || theme.iconPrimary}
      />
      <Path
        d="M9.696 9.72a7.943 7.943 0 0 0-8.12 0A3.158 3.158 0 0 0 0 12.304a3.131 3.131 0 0 0 1.568 2.568 7.885 7.885 0 0 0 8.128 0 3.156 3.156 0 0 0 1.568-2.584A3.15 3.15 0 0 0 9.696 9.72Z"
        fill={color || theme.iconPrimary}
      />
      <Path
        d="M14.424 4.272a2.863 2.863 0 0 1-2.5 3.1h-.04a.374.374 0 0 0-.136.016 2.87 2.87 0 0 1-2.024-.664 3.661 3.661 0 0 0 1.2-3.04 3.713 3.713 0 0 0-.616-1.744 2.872 2.872 0 0 1 4.12 2.336Z"
        fill={color || theme.iconPrimary}
      />
      <Path
        d="M16.025 11.672a2.436 2.436 0 0 1-1.392 1.9 5.647 5.647 0 0 1-2.808.624 2.856 2.856 0 0 0 .976-1.856 3.152 3.152 0 0 0-1.336-2.7 6.6 6.6 0 0 0-1.84-1.008 6.252 6.252 0 0 1 5.36.936 2.431 2.431 0 0 1 1.04 2.104Z"
        fill={color || theme.iconPrimary}
      />
    </Svg>
  )
}

export default AccountsFilledIcon

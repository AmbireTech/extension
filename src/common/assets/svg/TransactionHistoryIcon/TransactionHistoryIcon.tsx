import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const TransactionHistoryIcon: React.FC<SvgProps> = ({
  width = 24,
  height = 24,
  color,
  ...rest
}) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" {...rest} fill="none">
      <Path
        d="m13 8-3-3 3-3"
        stroke={color || theme.iconPrimary}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M4.3 9.2c-.6 1-1 2.2-1.2 3.4s-.1 2.4.2 3.6.8 2.2 1.6 3.2 1.6 1.7 2.7 2.3"
        stroke={color || theme.iconPrimary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeDasharray="0.5 3"
        fill="none"
      />
      <Path
        d="M7.2 21.4c1.2.8 2.6 1.2 4 1.3s2.9 0 4.2-.6c1.3-.5 2.5-1.4 3.4-2.5s1.6-2.4 1.9-3.8q.45-2.1 0-4.2c-.3-1.4-1-2.7-1.9-3.8s-2.1-1.9-3.4-2.5c-1.3-.5-2.8-.7-4.2-.6"
        stroke={color || theme.iconPrimary}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M16.5 14.5h-4.2c-.1 0-.2-.1-.2-.2v-3.2"
        stroke={color || theme.iconPrimary}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  )
}

export default React.memo(TransactionHistoryIcon)

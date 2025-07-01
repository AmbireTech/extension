import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const EmailRecoveryIcon: React.FC<SvgProps> = ({ width = 50, height = 50, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 50 50" {...rest}>
      <G
        fill="none"
        stroke={color || theme.iconSecondary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <G>
          <Path d="M49 32.2A16.788 16.788 0 0 1 32.2 49l2.52-4.2" />
          <Path d="M1 17.8A16.788 16.788 0 0 1 17.8 1l-2.52 4.2" />
        </G>
        <G>
          <Path d="M31.5 35.371h-13c-3.9 0-6.5-1.95-6.5-6.5v-9.1c0-4.55 2.6-6.5 6.5-6.5h13c3.9 0 6.5 1.95 6.5 6.5v9.1c0 4.55-2.6 6.5-6.5 6.5Z" />
          <Path d="m31.5 20.421-4.069 3.25a4.115 4.115 0 0 1-4.875 0l-4.056-3.25" />
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(EmailRecoveryIcon)

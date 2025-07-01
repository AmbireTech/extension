import React, { FC } from 'react'
import { G, Path, Svg, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const DefaultWalletIcon: FC<SvgProps> = ({ width = 25.5, height = 24.8, color }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 25.5 24.844">
      <G
        fill="none"
        stroke={color || theme.iconSecondary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <Path d="M19.72 13.574a2.236 2.236 0 0 0-.668 1.815 2.374 2.374 0 0 0 2.4 2.082h2.115v1.324a4.2 4.2 0 0 1-4.186 4.186H8.131a4 4 0 0 0 .879-1.046 4.365 4.365 0 0 0 .646-2.293 4.45 4.45 0 0 0-7.236-3.477v-4.862a4.2 4.2 0 0 1 4.186-4.186h12.78a4.2 4.2 0 0 1 4.186 4.186v1.6H21.32a2.219 2.219 0 0 0-1.6.671Z" />
        <Path d="M2.42 12.305V7.219a3.17 3.17 0 0 1 2.048-2.974l8.839-3.34a2.115 2.115 0 0 1 2.861 1.982v4.232" />
        <Path d="M24.75 14.042v2.293a1.143 1.143 0 0 1-1.113 1.135h-2.183a2.374 2.374 0 0 1-2.4-2.082 2.294 2.294 0 0 1 2.271-2.483h2.316a1.143 1.143 0 0 1 1.109 1.137Z" />
        <Path d="M7.429 11.847h7.793" />
        <Path d="M9.656 19.641a4.365 4.365 0 0 1-.646 2.293 4 4 0 0 1-.879 1.046 4.347 4.347 0 0 1-2.928 1.113 4.419 4.419 0 0 1-3.807-2.16 4.365 4.365 0 0 1-.646-2.292 4.453 4.453 0 0 1 8.906 0Z" />
        <Path d="m3.461 19.65 1.1 1.1 2.366-2.188" />
      </G>
    </Svg>
  )
}

export default React.memo(DefaultWalletIcon)

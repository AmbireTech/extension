import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const CustomTokensIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 21.524 21.5">
      <G>
        <G
          fill="none"
          stroke={color || theme.iconSecondary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        >
          <G>
            <Path d="M7.183 12.172a1.965 1.965 0 0 0 1.922 2.053h2.042a1.778 1.778 0 0 0 1.682-1.8 1.651 1.651 0 0 0-1.081-1.8L8.383 9.349c-.841-.128-1.2-.513-1.2-1.54a1.7 1.7 0 0 1 1.682-1.8h2.162a1.965 1.965 0 0 1 1.922 2.053" />
            <Path d="M9.945 5.073v10.088" />
          </G>
          <Path d="M19.417 8.772A9.383 9.383 0 0 0 .75 10.132a9.461 9.461 0 0 0 7.978 9.278" />
          <G>
            <Path d="m17.126 12.607-4.612 4.612a1.605 1.605 0 0 0-.391.769l-.248 1.759a.827.827 0 0 0 .99.99l1.759-.248a1.55 1.55 0 0 0 .769-.396l4.612-4.612a1.778 1.778 0 0 0 0-2.892 1.772 1.772 0 0 0-2.879.018Z" />
            <Path d="M16.462 13.272a4.15 4.15 0 0 0 2.892 2.892" />
          </G>
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(CustomTokensIcon)

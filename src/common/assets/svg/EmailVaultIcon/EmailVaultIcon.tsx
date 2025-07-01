import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const EmailVaultIcon: React.FC<SvgProps> = ({
  width = 50,
  height = 50,
  strokeWidth = 2,
  color
}) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 49.664 49.999">
      <G>
        <Path
          fill="none"
          stroke={color || theme.iconSecondary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
          d="M46.394 26.302V37.65c0 7.944-4.539 11.348-11.348 11.348h-22.7C5.539 48.999 1 45.594 1 37.65V21.762c0-7.948 4.539-11.348 11.348-11.348h15.888"
        />
        <Path
          fill="none"
          stroke={color || theme.iconSecondary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
          d="m12.348 22.897 7.1 5.674a7.185 7.185 0 0 0 8.511 0l2.678-2.134"
        />
        <G>
          <G
            fill="none"
            stroke={color || theme.iconSecondary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          >
            <Path d="M36.438 8.858h0V6.237a5.25 5.25 0 0 1 5.24-5.238 5.25 5.25 0 0 1 5.24 5.238V8.85l-4.005-1.289a4.114 4.114 0 0 0-1.241-.162 4 4 0 0 0-1.229.162l-4 1.3Z" />
            <Path d="m40.443 7.557-4.054 1.314a2.466 2.466 0 0 0-1.7 2.1v5.192a3.26 3.26 0 0 0 1.405 2.4l3.493 2.243a4.2 4.2 0 0 0 4.176 0l3.493-2.243a3.26 3.26 0 0 0 1.405-2.4v-5.189a2.467 2.467 0 0 0-1.7-2.11l-4.049-1.307a4.774 4.774 0 0 0-2.469 0Z" />
          </G>
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(EmailVaultIcon)

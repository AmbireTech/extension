import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const NetworksIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 21.5 21.533">
      <G>
        <G
          fill="none"
          stroke={color || theme.iconSecondary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        >
          <Path d="m11.75.995 6.98 3.429a1.079 1.079 0 0 1 0 1.944l-6.98 3.429a2.255 2.255 0 0 1-1.973 0l-6.98-3.429a1.079 1.079 0 0 1 0-1.944L9.777.995a2.255 2.255 0 0 1 1.973 0Z" />
          <G>
            <Path d="m2.291 9.189 5.792 2.96a2.192 2.192 0 0 1 1.178 1.944v5.589a1.063 1.063 0 0 1-1.541.967l-5.792-2.96A2.192 2.192 0 0 1 .75 15.745v-5.588a1.063 1.063 0 0 1 1.541-.968Z" />
            <Path d="m19.209 9.189-5.792 2.96a2.192 2.192 0 0 0-1.178 1.944v5.589a1.063 1.063 0 0 0 1.541.967l5.792-2.96a2.192 2.192 0 0 0 1.178-1.944v-5.588a1.063 1.063 0 0 0-1.541-.968Z" />
          </G>
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(NetworksIcon)

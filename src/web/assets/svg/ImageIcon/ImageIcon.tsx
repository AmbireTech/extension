import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const ImageIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 26.41 26">
      <G
        fill="none"
        stroke={color || theme.iconSecondary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <Path d="M9.398 25h7.2c6 0 8.4-2.4 8.4-8.4V9.4c0-6-2.4-8.4-8.4-8.4h-7.2c-6 0-8.4 2.4-8.4 8.4v7.2c0 6 2.4 8.4 8.4 8.4Z" />
        <Path d="M9.398 10.6a2.4 2.4 0 1 0-2.4-2.4 2.4 2.4 0 0 0 2.4 2.4Z" />
        <Path d="m1.803 21.341 5.916-3.972a2.7 2.7 0 0 1 3.168.168l.4.348a2.675 2.675 0 0 0 3.384 0l4.988-4.285a2.675 2.675 0 0 1 3.384 0l1.956 1.68" />
      </G>
    </Svg>
  )
}

export default React.memo(ImageIcon)

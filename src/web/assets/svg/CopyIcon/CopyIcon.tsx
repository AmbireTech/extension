import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const CopyIcon: React.FC<Props> = ({ width = 24, height = 24, color, strokeWidth = '2' }) => {
  const { theme } = useTheme()
  return (
    <Svg width={height} height={width} viewBox="0 0 22 22">
      <G
        fill="none"
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      >
        <Path d="M15 11.9v4.2c0 3.5-1.4 4.9-4.9 4.9H5.9C2.4 21 1 19.6 1 16.1v-4.2C1 8.4 2.4 7 5.9 7h4.2c3.5 0 4.9 1.4 4.9 4.9Z" />
        <Path d="M21 5.9v4.2c0 3.5-1.4 4.9-4.9 4.9H15v-3.1C15 8.4 13.6 7 10.1 7H7V5.9C7 2.4 8.4 1 11.9 1h4.2C19.6 1 21 2.4 21 5.9Z" />
      </G>
    </Svg>
  )
}

export default React.memo(CopyIcon)

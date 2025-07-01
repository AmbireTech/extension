import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

interface Props extends SvgProps {
  width?: number
  height?: number
  strokeWidth?: string
}

const UpArrowIcon: React.FC<Props> = ({ width = 15, height = 9, strokeWidth = '1.5', color }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 14.879 8.466">
      <Path
        d="M-5813.015-21729.285l-6.348,6.373,6.348,6.385"
        transform="translate(-21715.467 5820.421) rotate(90)"
        fill="none"
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth={strokeWidth}
      />
    </Svg>
  )
}

export default React.memo(UpArrowIcon)

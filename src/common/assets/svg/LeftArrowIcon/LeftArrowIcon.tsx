import React from 'react'
import Svg, { Path } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'
import { LegendsSvgProps } from '@legends/types/svg'

interface Props extends LegendsSvgProps {
  width?: number
  height?: number
  weight?: string
}

const LeftArrowIcon: React.FC<Props> = ({ width = 8, height = 15, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 8.467 14.879" {...rest}>
      <Path
        d="M-5813.015-21729.285l-6.348,6.373,6.348,6.385"
        transform="translate(5820.421 21730.346)"
        fill="none"
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </Svg>
  )
}

export default React.memo(LeftArrowIcon)

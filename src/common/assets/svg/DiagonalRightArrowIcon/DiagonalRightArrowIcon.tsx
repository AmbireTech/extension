import React from 'react'
import Svg, { G, Line, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const DiagonalRightArrowIcon: React.FC<SvgProps> = ({
  width = 14,
  height = 14,
  color,
  ...rest
}) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} {...rest} viewBox="0 0 13.787 13.781">
      <G transform="translate(-180.281 1.031)">
        <Path
          d="M-16486.969-20972.039h12v12"
          transform="translate(16668 20972.039)"
          fill="none"
          stroke={color || theme.iconPrimary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <Line
          y1={11.25}
          x2={11.25}
          transform="translate(181.758 0.029)"
          fill="none"
          stroke={color || theme.iconPrimary}
          strokeLinecap="round"
          strokeWidth="1.5"
        />
      </G>
    </Svg>
  )
}

export default React.memo(DiagonalRightArrowIcon)

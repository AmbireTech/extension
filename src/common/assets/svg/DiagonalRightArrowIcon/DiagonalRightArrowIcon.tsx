import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const DiagonalRightArrowIcon: React.FC<SvgProps> = ({
  width = 24,
  height = 24,
  color,
  ...rest
}) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} {...rest} fill="none" viewBox="0 0 20 20">
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="1.5"
        d="M14 6v8m0 0H6m8 0L7.333 7.333"
      />
    </Svg>
  )
}

export default React.memo(DiagonalRightArrowIcon)

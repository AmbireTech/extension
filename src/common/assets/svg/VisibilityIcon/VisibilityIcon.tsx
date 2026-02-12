import React from 'react'
import Svg, { Circle, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const VisibilityIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} fill="none" height={height} viewBox="0 0 28 28" {...rest}>
      <Circle cx="14" cy="14" r="3.917" stroke={theme.iconPrimary} strokeWidth="1.5" />
      <Path
        stroke={theme.iconPrimary}
        strokeWidth="1.5"
        d="M23.693 12.928c.386.48.58.719.58 1.072 0 .353-.194.593-.58 1.072C22.109 17.032 18.366 21 14 21s-8.109-3.967-9.693-5.928c-.386-.48-.58-.719-.58-1.072 0-.353.194-.593.58-1.072C5.891 10.968 9.634 7 14 7s8.109 3.967 9.693 5.928Z"
      />
    </Svg>
  )
}

export default React.memo(VisibilityIcon)

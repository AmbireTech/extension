import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

/** An arrow leaving a door, e.g. for taking funds back out (heroicons' arrow-right-start-on-rectangle). */
const ExitIcon: React.FC<SvgProps> = ({
  width = 28,
  height = 28,
  color,
  strokeWidth = '1.5',
  ...rest
}) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 28 28" {...rest}>
      <Path
        d="M18.1364 10.8889V7C18.1364 5.71134 17.068 4.66667 15.75 4.66667H9.38636C8.06841 4.66667 7 5.71134 7 7V21C7 22.2887 8.06841 23.3333 9.38636 23.3333H15.75C17.068 23.3333 18.1364 22.2887 18.1364 21V17.1111M21.3182 10.8889L24.5 14L21.3182 17.1111M24.5 14L10.9773 14"
        stroke={color || theme.iconSecondary}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default React.memo(ExitIcon)

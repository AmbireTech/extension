import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const PasswordRecoverySettingsIcon: React.FC<SvgProps> = ({
  width = 24,
  height = 24,
  color,
  ...rest
}) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" {...rest} fill="none">
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="1.5"
        d="M8.363 16.849H4.727v3.636"
      />
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="1.5"
        d="M20.28 14.218a8.573 8.573 0 0 1-14.941 3.176M15.637 7.151h3.636V3.515"
      />
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="1.5"
        d="M3.72 9.782a8.571 8.571 0 0 1 14.941-3.176"
      />
      <Path stroke={color || theme.iconPrimary} strokeLinecap="round" d="M17 14.375H7" />
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m12 10 .179.627.633-.158-.454.469.454.468-.633-.158-.179.627-.179-.627-.633.158.454-.469-.454-.468.633.158L12 10ZM7.938 10l.179.627.632-.158-.453.469.453.468-.632-.158-.18.627-.179-.627-.632.158.453-.469-.453-.468.632.158.18-.627ZM16.063 10l.178.627.633-.158-.453.469.453.468-.633-.158-.178.627-.18-.627-.632.158.453-.469-.453-.468.633.158.178-.627Z"
      />
    </Svg>
  )
}

export default React.memo(PasswordRecoverySettingsIcon)

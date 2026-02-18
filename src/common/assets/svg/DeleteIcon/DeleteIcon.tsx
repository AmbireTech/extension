import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const DeleteIcon: React.FC<SvgProps> = ({
  width = 24,
  height = 24,
  color,
  strokeWidth = '1.5',
  ...rest
}) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 28 28" fill="none" {...rest}>
      <Path
        stroke={theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="1.5"
        d="M11.667 17.5V14M16.333 17.5V14"
      />
      <Path
        stroke={theme.iconPrimary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M3.5 8.167h21c-1.404 0-2.107 0-2.611.337a2 2 0 0 0-.552.552C21 9.56 21 10.263 21 11.667v7.667c0 1.885 0 2.828-.586 3.414-.586.586-1.528.586-3.414.586h-6c-1.886 0-2.828 0-3.414-.586C7 22.162 7 21.219 7 19.334v-7.667c0-1.405 0-2.107-.337-2.611a2 2 0 0 0-.552-.552c-.504-.337-1.207-.337-2.611-.337Z"
      />
      <Path
        stroke={theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="1.5"
        d="M11.746 3.932c.133-.124.426-.233.833-.311.408-.079.907-.121 1.421-.121s1.013.042 1.42.12c.408.079.7.188.834.312"
      />
    </Svg>
  )
}

export default React.memo(DeleteIcon)

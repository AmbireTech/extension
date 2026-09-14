import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const UnstakeIcon: React.FC<Props> = ({ width = 28, height = 28, color, strokeWidth = '1.5' }) => {
  const { theme } = useTheme()
  const strokeColor = color || theme.iconSecondary

  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 9L12 14C10.0474 12.0474 8.95262 10.9526 7 9M12 14L12 5"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 16L5 17C5 18.1046 5.89543 19 7 19L17 19C18.1046 19 19 18.1046 19 17V16"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  )
}

export default React.memo(UnstakeIcon)

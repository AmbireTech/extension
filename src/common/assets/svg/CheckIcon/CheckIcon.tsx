import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const CheckIcon: React.FC<SvgProps> = ({ width = 20, height = 20, color, ...props }) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} viewBox="0 0 20 20" {...props} fill="none">
      <Path
        stroke={color || theme.success400}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M10 17.5A7.5 7.5 0 1 0 2.5 10a7.522 7.522 0 0 0 7.5 7.5Z"
      />
      <Path
        stroke={color || theme.success400}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="m6.458 10 2.359 2.358 4.725-4.716"
      />
    </Svg>
  )
}

export default React.memo(CheckIcon)

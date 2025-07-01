import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const WarningIcon: React.FC<SvgProps> = ({
  width = 24,
  height = 24,
  color,
  strokeWidth = '1.5',
  ...rest
}) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24" {...rest}>
      <Path
        stroke={color || theme.iconSecondary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        d="M12 9v5m0 7.41H5.94c-3.47 0-4.92-2.48-3.24-5.51l3.12-5.62L8.76 5c1.78-3.21 4.7-3.21 6.48 0l2.94 5.29 3.12 5.62c1.68 3.03.22 5.51-3.24 5.51H12v-.01Z"
      />
      <Path
        stroke={color || theme.iconSecondary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        d="M11.995 17h.009"
      />
    </Svg>
  )
}

export default React.memo(WarningIcon)

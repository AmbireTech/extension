import React from 'react'
import Svg, { Circle, G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const AddCircularIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" {...rest} fill="none">
      <Circle cx="12" cy="12" r="8.25" stroke={color || theme.iconPrimary} strokeWidth="1.5" />
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="1.5"
        d="M12 8v8M16 12H8"
      />
    </Svg>
  )
}

export default React.memo(AddCircularIcon)

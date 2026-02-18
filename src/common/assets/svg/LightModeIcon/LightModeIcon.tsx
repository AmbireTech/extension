import React from 'react'
import Svg, { Circle, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const LightModeIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24" {...rest}>
      <Circle cx="12" cy="12" r="3.25" stroke={color || theme.iconPrimary} strokeWidth="1.5" />
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="1.5"
        d="M12 5V3M12 21v-2M16.95 7.05l1.414-1.414M5.637 18.364 7.05 16.95M19 12h2M3 12h2M16.95 16.95l1.414 1.414M5.637 5.636 7.05 7.05"
      />
    </Svg>
  )
}

export default React.memo(LightModeIcon)

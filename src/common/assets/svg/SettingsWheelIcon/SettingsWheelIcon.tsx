import React from 'react'
import Svg, { Circle, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const SettingsWheelIcon: React.FC<SvgProps> = ({
  width = 24,
  height = 24,
  strokeWidth = '1.5',
  color,
  ...rest
}) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} viewBox="0 0 28 28" {...rest} fill="none">
      <Path
        stroke={color || theme.iconPrimary}
        strokeWidth={strokeWidth}
        d="M3.415 15.944c-.529-.95-.793-1.425-.793-1.944 0-.519.264-.994.793-1.944L5.17 8.902l1.855-3.097c.558-.933.838-1.4 1.287-1.659.45-.26.993-.268 2.08-.285L14 3.803l3.608.058c1.088.017 1.632.026 2.081.285.45.26.729.726 1.288 1.66l1.854 3.096 1.754 3.154c.529.95.793 1.425.793 1.944 0 .519-.264.994-.793 1.944l-1.754 3.154-1.854 3.097c-.56.933-.839 1.4-1.288 1.659-.45.26-.993.268-2.08.285L14 24.197l-3.608-.058c-1.088-.017-1.632-.026-2.081-.285-.45-.26-.729-.726-1.287-1.66l-1.855-3.096-1.754-3.153Z"
      />
      <Circle
        cx="14"
        cy="14"
        r="3.5"
        stroke={color || theme.iconPrimary}
        strokeWidth={strokeWidth}
      />
    </Svg>
  )
}

export default React.memo(SettingsWheelIcon)

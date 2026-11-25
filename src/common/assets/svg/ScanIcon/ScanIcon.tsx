import React, { FC, memo } from 'react'
import { Path, Svg } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'
import { LegendsSvgProps } from '@legends/types/svg'

const ScanIcon: FC<LegendsSvgProps> = ({
  width = 24,
  height = 24,
  color,
  strokeWidth = 1.5,
  ...rest
}) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        d="M8.57031 4.28557H7.28459C5.87038 4.28557 5.16327 4.28557 4.72393 4.72491C4.28459 5.16425 4.28459 5.87136 4.28459 7.28557V8.57129"
        stroke={color || theme.iconPrimary}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M8.57031 19.7144H7.28459C5.87038 19.7144 5.16327 19.7144 4.72393 19.2751C4.28459 18.8358 4.28459 18.1286 4.28459 16.7144V15.4287"
        stroke={color || theme.iconPrimary}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M15.4297 4.28557H16.7154C18.1296 4.28557 18.8367 4.28557 19.2761 4.72491C19.7154 5.16425 19.7154 5.87136 19.7154 7.28557V8.57129"
        stroke={color || theme.iconPrimary}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M15.4297 19.7144H16.7154C18.1296 19.7144 18.8367 19.7144 19.2761 19.2751C19.7154 18.8358 19.7154 18.1286 19.7154 16.7144V15.4287"
        stroke={color || theme.iconPrimary}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M7.1 12.07C7.1 12.07 10.11 12.88 12 12.88C13.89 12.88 16.9 12.07 16.9 12.07"
        stroke={color || theme.iconPrimary}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  )
}

export default memo(ScanIcon)

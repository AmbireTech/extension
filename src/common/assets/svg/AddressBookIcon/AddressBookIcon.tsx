import React from 'react'
import Svg, { Circle, Path, Rect, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const AddressBookIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Rect
        width="15"
        height="17"
        x="5"
        y="4"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        rx="2"
      />
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="1.5"
        d="M3 8h4M3 12h4M3 16h4"
      />
      <Circle
        cx="14"
        cy="9.2"
        r="2.45"
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="1.5"
        d="M14 14c2.704 0 3.58 1.828 3.864 3.012.129.537-.312.988-.864.988h-6c-.552 0-.993-.45-.864-.988C10.42 15.828 11.296 14 14 14Z"
      />
    </Svg>
  )
}

export default React.memo(AddressBookIcon)

import React from 'react'
import Svg, { Circle, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const LockIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...rest}>
      <Circle cx="12" cy="15" r="2" fill={color || theme.iconPrimary} />
      <Path
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        d="M4.5 13.5c0-1.886 0-2.828.586-3.414C5.672 9.5 6.614 9.5 8.5 9.5h7c1.886 0 2.828 0 3.414.586.586.586.586 1.528.586 3.414v1c0 2.828 0 4.243-.879 5.121-.878.879-2.293.879-5.121.879h-3c-2.828 0-4.243 0-5.121-.879C4.5 18.743 4.5 17.328 4.5 14.5v-1Z"
      />
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="1.5"
        d="M16.5 9.5V8a4.5 4.5 0 1 0-9 0v1.5"
      />
    </Svg>
  )
}

export default React.memo(LockIcon)

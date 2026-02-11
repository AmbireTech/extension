import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const TrezorLockIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        d="M12 2.75a9.25 9.25 0 1 1 0 18.5 9.25 9.25 0 0 1 0-18.5Z"
      />
      <Path
        stroke={color || theme.iconPrimary}
        strokeWidth="1.2"
        d="M15.775 9.85v5.84L12 17.578 8.225 15.69V9.85h7.55Z"
      />
      <Path
        stroke={color || theme.iconPrimary}
        strokeWidth="1.2"
        d="M14.5 10.125V8.25a2.5 2.5 0 0 0-5 0v1.875"
      />
    </Svg>
  )
}

export default React.memo(TrezorLockIcon)

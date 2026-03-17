import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const LedgerLetterIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        d="M12 2.75a9.25 9.25 0 1 1 0 18.5 9.25 9.25 0 0 1 0-18.5Z"
      />
      <Path stroke={color || theme.iconPrimary} strokeWidth="1.5" d="M10.889 16.222H7V14" />
      <Path
        stroke={color || theme.iconPrimary}
        strokeWidth="1.2"
        d="M10.889 7.778H7V10M11.222 9.778v3.888h2.222M13.111 7.778H17V10M13.111 16.222H17V14"
      />
    </Svg>
  )
}

export default React.memo(LedgerLetterIcon)

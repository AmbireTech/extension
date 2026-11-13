import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const BulbIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  const strokeColor = color || theme.iconPrimary

  return (
    <Svg width={width} height={height} viewBox="0 0 16 16" fill="none" {...rest}>
      <Path
        stroke={strokeColor}
        strokeLinejoin="round"
        d="M6 11h4v-.6c0-.5.23-.96.6-1.28A4 4 0 1 0 5.4 9.12c.37.32.6.78.6 1.28v.6Z"
      />
      <Path stroke={strokeColor} strokeLinecap="round" d="M6.5 13h3" />
    </Svg>
  )
}

export default React.memo(BulbIcon)

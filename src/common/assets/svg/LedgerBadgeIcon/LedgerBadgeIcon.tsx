import React, { useId } from 'react'
import Svg, { Circle, Mask, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const LedgerBadgeIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  const maskId = useId().replace(/:/g, '')
  const iconColor = color || theme.iconPrimary

  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...rest}>
      <Mask id={maskId} maskUnits="userSpaceOnUse">
        <Circle cx="12" cy="12" r="10" fill="white" />
        <Path
          stroke="black"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.889 16.222H7V14"
        />
        <Path
          stroke="black"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.889 7.778H7V10M11.222 9.778v3.888h2.222M13.111 7.778H17V10M13.111 16.222H17V14"
        />
      </Mask>
      <Circle cx="12" cy="12" r="10" fill={iconColor} mask={`url(#${maskId})`} />
    </Svg>
  )
}

export default React.memo(LedgerBadgeIcon)

import React, { useId } from 'react'
import Svg, { Circle, Mask, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const TrezorBadgeIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  const maskId = useId().replace(/:/g, '')
  const iconColor = color || theme.iconPrimary

  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...rest}>
      <Mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <Circle cx="12" cy="12" r="10" fill="white" />
        <Path
          stroke="black"
          strokeWidth="1.5"
          d="M15.775 9.85v5.84L12 17.578 8.225 15.69V9.85h7.55Z"
        />
        <Path stroke="black" strokeWidth="1.2" d="M14.5 10.125V8.25a2.5 2.5 0 0 0-5 0v1.875" />
      </Mask>
      <Circle cx="12" cy="12" r="10" fill={iconColor} mask={`url(#${maskId})`} />
    </Svg>
  )
}

export default React.memo(TrezorBadgeIcon)

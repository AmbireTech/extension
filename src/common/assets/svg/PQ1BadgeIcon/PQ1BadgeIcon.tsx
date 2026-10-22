import React, { useId } from 'react'
import Svg, { Circle, G, Mask, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

/** PQ1 badge: the Freedom Factory "FF" monogram cut out of a filled circle,
 *  in the same style as TrezorBadgeIcon / LedgerBadgeIcon. */
const PQ1BadgeIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  const maskId = useId().replaceAll(':', '')
  const iconColor = color || theme.iconPrimary

  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...rest}>
      <Mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <Circle cx="12" cy="12" r="10" fill="white" />
        <G transform="translate(5 7.54) scale(0.0427)" fill="black">
          <Path d="M129.267 59.1005H54.9756L48.0771 94.1518H108.041L104.326 120.175H43.8315L32.6878 177H0L27.9123 32.0155H134.574L129.267 59.1005Z" />
          <Path d="M122.899 177H97.9582L182.332 32.0155H206.742L122.899 177Z" />
          <Path d="M322.955 59.1005H249.725L242.826 94.1518H302.79L297.484 120.706H236.989L226.907 177H194.537L221.6 32.0155H327.99L322.955 59.1005Z" />
        </G>
      </Mask>
      <Circle cx="12" cy="12" r="10" fill={iconColor} mask={`url(#${maskId})`} />
    </Svg>
  )
}

export default React.memo(PQ1BadgeIcon)

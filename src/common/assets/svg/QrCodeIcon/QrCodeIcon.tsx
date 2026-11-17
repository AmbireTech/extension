import React, { FC } from 'react'
import { Path, Rect, Svg, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

/**
 * A QR code in a scanner's frame, so a QR-based key does not look like the button that shows
 * the account's address as a QR code (`ReceiveIcon`)
 */
const QrCodeIcon: FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  const iconColor = color || theme.iconPrimary

  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...rest}>
      {/* The frame's corners */}
      <Path
        d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M3 17v2a2 2 0 0 0 2 2h2M21 17v2a2 2 0 0 1-2 2h-2"
        stroke={iconColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Rect
        x="6.25"
        y="6.25"
        width="4.5"
        height="4.5"
        rx="1.2"
        stroke={iconColor}
        strokeWidth="1.5"
      />
      <Rect
        x="13.25"
        y="6.25"
        width="4.5"
        height="4.5"
        rx="1.2"
        stroke={iconColor}
        strokeWidth="1.5"
      />
      <Rect
        x="6.25"
        y="13.25"
        width="4.5"
        height="4.5"
        rx="1.2"
        stroke={iconColor}
        strokeWidth="1.5"
      />
      {/* The broken square in the bottom right corner */}
      <Path
        d="M13.25 17.75v-3.5a1 1 0 0 1 1-1h1.5M17.75 13.25v3.5a1 1 0 0 1-1 1h-1.5"
        stroke={iconColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Rect x="7.75" y="7.75" width="1.5" height="1.5" rx="0.3" fill={iconColor} />
      <Rect x="14.75" y="7.75" width="1.5" height="1.5" rx="0.3" fill={iconColor} />
      <Rect x="7.75" y="14.75" width="1.5" height="1.5" rx="0.3" fill={iconColor} />
      <Rect x="14.75" y="14.75" width="1.5" height="1.5" rx="0.3" fill={iconColor} />
    </Svg>
  )
}

export default React.memo(QrCodeIcon)

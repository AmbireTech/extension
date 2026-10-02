import React from 'react'
import Svg, { Circle, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

/**
 * A globe with an eye-slash badge: network requests that are hidden from the
 * services they reach. The globe's outline stops short of the badge instead of
 * being masked, so it renders the same on any background.
 */
const PrivacyNetworkIcon: React.FC<SvgProps> = ({
  width = 24,
  height = 24,
  color,
  strokeWidth = 1.5
}) => {
  const { theme } = useTheme()
  const iconColor = color || theme.iconPrimary

  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke={iconColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M17.173 11.049A7.25 7.25 0 1 0 11.049 17.173" />
      <Path d="M10 2.75A3 7.25 0 0 0 10 17.25" />
      <Path d="M10 2.75A3 7.25 0 0 1 12.65 13.4" />
      <Path d="M2.75 10h14.5" />
      <Path d="M13.5 18c1.2-1.8 2.75-2.7 4.5-2.7s3.3.9 4.5 2.7c-1.2 1.8-2.75 2.7-4.5 2.7s-3.3-.9-4.5-2.7Z" />
      <Circle cx={18} cy={18} r={1.15} />
      <Path d="M14.75 14.75l6.5 6.5" />
    </Svg>
  )
}

export default React.memo(PrivacyNetworkIcon)

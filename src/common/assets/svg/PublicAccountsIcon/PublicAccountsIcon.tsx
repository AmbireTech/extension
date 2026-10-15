import React from 'react'
import Svg, { Circle, G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

/** Two people in a circle, the icon of the public (regular) accounts. */
const PublicAccountsIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  const iconColor = color || theme.iconPrimary

  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...rest}>
      <G
        transform="translate(1.5 1.5)"
        stroke={iconColor}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path d="M12.4625 14.8042C13.0071 14.9628 13.5831 15.0478 14.1789 15.0478C15.1457 15.0478 16.0603 14.8239 16.8737 14.4252C16.8752 14.3877 16.876 14.35 16.876 14.3122C16.876 12.8225 15.6684 11.6149 14.1789 11.6149C13.2517 11.6149 12.4338 12.0828 11.9483 12.7953M11.9483 12.7953C11.2392 11.507 9.86867 10.6341 8.29426 10.6341C5.99218 10.6341 4.12598 12.5004 4.12598 14.8026C4.12598 14.8264 4.12618 14.8503 4.12658 14.874C5.34386 15.607 6.76983 16.0286 8.29426 16.0286C9.81868 16.0286 11.2447 15.607 12.4619 14.874C12.4623 14.8508 12.4625 14.8275 12.4625 14.8042V14.8026C12.4625 14.0749 12.2761 13.3907 11.9483 12.7953Z" />
        <Path d="M10.5023 6.9567C10.5023 8.17549 9.51435 9.16351 8.2956 9.16351C7.07686 9.16351 6.08887 8.17549 6.08887 6.9567C6.08887 5.7379 7.07686 4.74988 8.2956 4.74988C9.51435 4.74988 10.5023 5.7379 10.5023 6.9567Z" />
        <Path d="M15.8966 8.42791C15.8966 9.37586 15.1281 10.1443 14.1802 10.1443C13.2323 10.1443 12.4639 9.37586 12.4639 8.42791C12.4639 7.47996 13.2323 6.71149 14.1802 6.71149C15.1281 6.71149 15.8966 7.47996 15.8966 8.42791Z" />
        <Circle cx="10.5" cy="10.5" r="10" />
      </G>
    </Svg>
  )
}

export default React.memo(PublicAccountsIcon)

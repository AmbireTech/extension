import React, { FC } from 'react'
import { Path, Svg, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

/**
 * 0xBow's mark, without the "0xbow" wordmark next to it, traced from its website's logo
 * (0xbow.io). In the text's color, as 0xBow's own is one color too: white on dark.
 */
const OxBowIcon: FC<SvgProps> = ({ width = 24, height = 24 }) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} viewBox="0 0 350 361" fill="none">
      <Path
        fill={theme.primaryText}
        fillRule="evenodd"
        d="M1.2 0.9L238.6 32.9L62.9 63.6L59.1 73.9L10.9 253.7L9.9 252.7ZM303.5 38.9L349.5 131.9L300.4 315.9L47 359.9L0 306.9L245 255.9ZM210.1 98.9L216.1 98.9L197.9 161.8L156.9 169.5L143.9 216.3L84.6 226.9L78.9 227.8L78.7 224.9L107.9 117Z"
      />
    </Svg>
  )
}

export default React.memo(OxBowIcon)

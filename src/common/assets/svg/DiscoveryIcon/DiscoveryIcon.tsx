import React from 'react'
import Svg, { Circle, G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const DiscoveryIcon: React.FC<SvgProps> = ({ width = 21, height = 21, color }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 21.061 21.065">
      <G transform="translate(-801.268 -868)">
        <G
          transform="translate(801.268 868)"
          fill="none"
          stroke={color || theme.iconPrimary}
          stroke-width="1.5"
        >
          <Circle cx="8.854" cy="8.854" r="8.854" stroke="none" />
          <Circle cx="8.854" cy="8.854" r="8.104" fill="none" />
        </G>
        <Path
          d="M0,0,5.033,5.033"
          transform="translate(816.234 882.971)"
          fill="none"
          stroke={color || theme.iconPrimary}
          stroke-linecap="round"
          stroke-width="1.5"
        />
      </G>
    </Svg>
  )
}

export default React.memo(DiscoveryIcon)

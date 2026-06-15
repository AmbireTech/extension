import React, { FC } from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const PlugDisconnectIcon: FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} viewBox="0 0 20 20" fill="none" {...rest}>
      <Path
        d="M10 2.5L10 7.5"
        stroke={color || theme.iconPrimary}
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <Path
        d="M7.48102 4.1665C5.04785 5.117 3.33325 7.62006 3.33325 10.2894C3.33325 13.8114 6.31802 16.6665 9.99992 16.6665C13.6818 16.6665 16.6666 13.8114 16.6666 10.2894C16.6666 7.62006 14.952 5.11703 12.5188 4.16654"
        stroke={color || theme.iconPrimary}
        stroke-width="1.5"
        stroke-linecap="round"
      />
    </Svg>
  )
}

export default React.memo(PlugDisconnectIcon)

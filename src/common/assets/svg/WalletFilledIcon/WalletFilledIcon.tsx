import React, { FC } from 'react'
import { Path, Svg, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const WalletFilledIcon: FC<SvgProps> = ({ width, height, color }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 15.238 16">
      <Path
        d="M9.9 1.524v3.047H8.7V1.524a.319.319 0 0 0-.441-.3L1.9 3.625a1.077 1.077 0 0 0-.7 1.019v.537A3 3 0 0 0 0 7.587V4.644a2.284 2.284 0 0 1 1.476-2.142L7.844.096a1.584 1.584 0 0 1 .537-.1A1.528 1.528 0 0 1 9.9 1.524Z"
        fill={color || theme.iconPrimary}
      />
      <Path
        d="M15.233 9.985v.8a.4.4 0 0 1-.393.4h-1.166a.83.83 0 0 1-.842-.73.8.8 0 0 1 .233-.642.762.762 0 0 1 .561-.233h1.207a.4.4 0 0 1 .4.405Z"
        fill={color || theme.iconPrimary}
      />
      <Path
        d="M13.618 8.742h.818a.8.8 0 0 0 .8-.8v-.353a3.022 3.022 0 0 0-3.016-3.016H3.016A3.024 3.024 0 0 0 0 7.587v5.4a3.022 3.022 0 0 0 3.016 3.016h9.207a3.022 3.022 0 0 0 3.016-3.016v-.152a.8.8 0 0 0-.8-.8h-.7a1.741 1.741 0 0 1-1.709-1.219 1.652 1.652 0 0 1 1.588-2.069Zm-4.395-.16H3.609a.6.6 0 1 1 0-1.2h5.614a.6.6 0 0 1 0 1.2Z"
        fill={color || theme.iconPrimary}
      />
    </Svg>
  )
}

export default React.memo(WalletFilledIcon)

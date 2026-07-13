import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const WalletConnectIcon: React.FC<SvgProps> = ({ width = 20, height = 20, color, ...rest }) => {
  const { theme } = useTheme()
  const fillColor = color || theme.iconPrimary

  return (
    <Svg width={width} height={height} viewBox="0 0 20 20" fill="none" {...rest}>
      <Path
        fill={fillColor}
        d="M4.913 6.997c2.81-2.745 7.364-2.745 10.174 0l.338.331a.347.347 0 0 1 0 .499l-1.157 1.131a.183.183 0 0 1-.254 0l-.466-.455c-1.96-1.916-5.137-1.916-7.096 0l-.499.488a.183.183 0 0 1-.254 0L4.542 7.86a.347.347 0 0 1 0-.499l.371-.363Zm12.57 2.343 1.03 1.006a.347.347 0 0 1 0 .499l-4.643 4.537a.366.366 0 0 1-.508 0L10.067 12.16a.092.092 0 0 0-.127 0l-3.296 3.222a.366.366 0 0 1-.508 0L1.494 10.845a.347.347 0 0 1 0-.499l1.03-1.006a.366.366 0 0 1 .507 0l3.296 3.222c.035.034.091.034.127 0l3.295-3.222a.366.366 0 0 1 .508 0l3.296 3.222c.035.034.092.034.127 0l3.295-3.222a.366.366 0 0 1 .508 0Z"
      />
    </Svg>
  )
}

export default React.memo(WalletConnectIcon)

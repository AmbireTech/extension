import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

/** The Tornado Cash wheel, without the wordmark - the icon of the Tornado Cash accounts and badge. */
const TornadoCashIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} viewBox="-3 -3 46 46" fill="none" {...rest}>
      <Path
        fill={color || theme.iconPrimary}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M29.4,8.6A11.5,11.5,0,0,1,39.9,19.4,17.1,17.1,0,0,0,8.5,10.5,11.5,11.5,0,0,1,19.3,0a17.2,17.2,0,0,0-8.9,31.4A11.5,11.5,0,0,1,0,20.6a17.1,17.1,0,0,0,31.3,9.1A11.4,11.4,0,0,1,20.6,40,17.1,17.1,0,0,0,29.4,8.6ZM19.9,27.2a6.9,6.9,0,0,1-5-2.1,7.1,7.1,0,1,1,5,2.1Z"
      />
    </Svg>
  )
}

export default React.memo(TornadoCashIcon)

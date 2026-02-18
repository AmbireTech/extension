import React, { FC } from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const PlugDisconnectIcon: FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} viewBox="0 0 16 16" fill="none" {...rest}>
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.617 8.486 7.514 4.383l1.23-1.23a2.902 2.902 0 1 1 4.103 4.102l-1.23 1.23ZM13.062 2.938 14.4 1.6M4.386 7.513l4.102 4.102-1.23 1.231a2.902 2.902 0 1 1-4.103-4.102l1.23-1.231ZM1.6 14.399l1.343-1.343M6.886 6.652 5.702 7.835M9.35 9.111l-1.186 1.186"
      />
    </Svg>
  )
}

export default React.memo(PlugDisconnectIcon)

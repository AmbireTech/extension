import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const XIcon: React.FC<SvgProps> = ({ width = 12, height = 12, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 12.5 11.607" {...rest}>
      <Path
        d="M18.844,10h1.917l-4.187,4.917,4.927,6.69H17.642l-3.021-4.058-3.458,4.058H9.247l4.479-5.26L9,10h3.955l2.731,3.708Zm-.672,10.429h1.062l-6.856-9.312h-1.14Z"
        transform="translate(-9 -10)"
        fill={theme.iconPrimary}
      />
    </Svg>
  )
}

export default React.memo(XIcon)

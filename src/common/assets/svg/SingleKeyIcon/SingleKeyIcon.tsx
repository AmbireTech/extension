import React, { FC } from 'react'
import { Circle, Path, Svg, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const SingleKeyIcon: FC<SvgProps> = ({ width = 16, height = 16, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 16 16" fill="none" {...rest}>
      <Circle cx="5.94873" cy="10.0513" r="3.28204" stroke={color || theme.iconPrimary} />
      <Path
        d="M8.41028 7.58974L11.2821 4.71795M12.5128 3.48718L11.2821 4.71795M11.2821 4.71795L13.3333 6.76923"
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
      />
    </Svg>
  )
}

export default React.memo(SingleKeyIcon)

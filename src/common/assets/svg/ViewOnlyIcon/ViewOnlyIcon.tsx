import React, { FC } from 'react'
import { Circle, Path, Svg, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const ViewOnlyIcon: FC<SvgProps> = ({
  width = 24,
  height = 24,
  color,
  strokeWidth = 1.5,
  ...rest
}) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" {...rest} fill="none">
      <Circle
        cx="12"
        cy="12"
        r="3.25"
        stroke={color || theme.iconPrimary}
        strokeWidth={strokeWidth}
      />
      <Path
        stroke={color || theme.iconPrimary}
        strokeWidth={strokeWidth}
        d="M20.188 10.934c.388.472.582.707.582 1.066 0 .359-.194.594-.582 1.066C18.768 14.79 15.636 18 12 18c-3.636 0-6.768-3.21-8.188-4.934-.388-.472-.582-.707-.582-1.066 0-.359.194-.594.582-1.066C5.232 9.21 8.364 6 12 6c3.636 0 6.768 3.21 8.188 4.934Z"
      />
    </Svg>
  )
}

export default React.memo(ViewOnlyIcon)

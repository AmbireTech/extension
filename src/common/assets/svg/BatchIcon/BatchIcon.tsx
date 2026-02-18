import React, { FC } from 'react'
import { Path, Svg, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const BatchIcon: FC<SvgProps> = ({ width = 24, height = 24, style, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg viewBox="0 0 24 24" width={width} height={height} style={style} {...rest} fill="none">
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M12 4 5 7l7 3 7-3-7-3Z"
      />
      <Path
        fill={color || theme.iconPrimary}
        d="M19.296 11.31a.75.75 0 0 1 0 1.38l-7 3a.753.753 0 0 1-.592 0l-7-3a.75.75 0 0 1 0-1.38l2.639-1.13 1.903.815L6.904 12 12 14.184 17.095 12l-2.343-1.005 1.905-.815 2.639 1.13Z"
      />
      <Path
        fill={color || theme.iconPrimary}
        d="M19.296 16.31a.75.75 0 0 1 0 1.38l-7 3a.753.753 0 0 1-.592 0l-7-3a.75.75 0 0 1 0-1.38l2.639-1.13 1.903.815L6.904 17 12 19.184 17.095 17l-2.343-1.005 1.905-.815 2.639 1.13Z"
      />
    </Svg>
  )
}

export default React.memo(BatchIcon)

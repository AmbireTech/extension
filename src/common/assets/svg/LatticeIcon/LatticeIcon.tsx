import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const LatticeIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()

  return (
    <Svg viewBox="0 0 24 24" width={width} height={height} fill="none" {...rest}>
      <Path
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        d="M12 2.75a9.25 9.25 0 1 1 0 18.5 9.25 9.25 0 0 1 0-18.5Z"
      />
      <Path
        fill={color || theme.iconPrimary}
        d="M20.118 9.978h-1.002v-.986h-.838v.986h-1.001v.787h1v.986h.838v-.986h1.002l.001-.787ZM7.091 13.567a1.879 1.879 0 0 1-.815.17 1.457 1.457 0 0 1-1.511-1.48 1.422 1.422 0 0 1 1.517-1.454c.385-.01.765.094 1.091.3l.383-.69a2.56 2.56 0 0 0-1.513-.42 2.264 2.264 0 1 0-.018 4.52A2.652 2.652 0 0 0 7.905 14v-1.737h-.814v1.305ZM12.25 11.614c0-1.012-.737-1.638-1.84-1.638H8.79v4.538h.89v-1.297h.782l.884 1.297h1.053l-1.04-1.495a1.48 1.48 0 0 0 .89-1.405Zm-1.918.82h-.651v-1.676h.658c.585 0 .987.316.987.858 0 .497-.393.819-.994.819v-.001ZM14.066 9.977h-.891v4.537h.89V9.977Z"
      />
      <Path
        fill={color || theme.iconPrimary}
        d="M19.112 12.283v-.136h-.83v.136s-.009.33-.024.44c-.084.634-.687 1.003-1.456 1.003h-.82v-2.962h.825v-.788h-1.715v4.538h1.75c1.256 0 2.172-.687 2.271-1.791.01-.11 0-.44 0-.44Z"
      />
    </Svg>
  )
}

export default React.memo(LatticeIcon)

import React, { FC } from 'react'
import { Path, Svg, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const AmbireLogoSquare: FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} {...rest} viewBox="0 0 24 24" fill="none">
      <Path
        fill={color || theme.primaryAccent200}
        d="M9.563 4.575a.25.25 0 0 1 .444.22L8.784 8.302l.714 1.387-1.62 2.193-1.266.703a.251.251 0 0 1-.344-.106l-.766-1.532a.25.25 0 0 1 .015-.249l4.045-6.123ZM15.783 9.171a.25.25 0 0 1 .282.138l2.624 5.576a.25.25 0 0 1-.053.286l-6.997 6.778a.25.25 0 0 1-.424-.18v-4.604l1.262-2.934 3.111-2.956v-1.86a.25.25 0 0 1 .195-.244Z"
      />
      <Path
        fill={color || theme.primaryAccent200}
        stroke={color || theme.primaryAccent200}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth=".5"
        d="m11.465 7.447.033-5.467 2.92 7.107L9.715 20.02l-4.428-4.21 6.177-8.363Z"
      />
    </Svg>
  )
}

export default React.memo(AmbireLogoSquare)

import React, { FC } from 'react'
import { Path, Svg, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const DownArrowLongIcon: FC<SvgProps> = ({ width, height, color, style = {} }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} style={style} viewBox="0 0 12.621 13.5">
      <Path
        fill="none"
        stroke={color || theme.iconSecondary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M6.311 12.75v-12M1.061 7.5l5.25 5.25 5.25-5.25"
      />
    </Svg>
  )
}

export default React.memo(DownArrowLongIcon)

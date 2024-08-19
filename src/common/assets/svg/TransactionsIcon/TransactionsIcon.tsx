import React, { FC } from 'react'
import { G, Path, Svg, SvgProps } from 'react-native-svg'

import { iconColors } from '@common/styles/themeConfig'

const TransactionsIcon: FC<SvgProps> = ({
  width,
  height,
  color = iconColors.secondary,
  ...rest
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 17.5 18.121" {...rest}>
      <G fill="none" stroke={color} strokeLinecap="round" strokeWidth="1.5">
        <Path d="M.75 7.146h14.262L8.75 1.061" />
        <Path d="M16.75 10.977H2.487l6.263 6.084" />
      </G>
    </Svg>
  )
}

export default React.memo(TransactionsIcon)

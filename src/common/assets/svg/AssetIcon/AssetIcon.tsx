import React, { FC } from 'react'
import { Path, Svg, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const AssetIcon: FC<SvgProps> = ({ width, height, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 16 16" {...rest}>
      <Path
        d="M7.995 15.997a8 8 0 1 1 8-8 8 8 0 0 1-8 8Zm-2.8-6.4v1.6h2v1.6h1.6v-1.6h.8a2 2 0 0 0 0-4h-3.2a.4.4 0 1 1 0-.8h4.4v-1.6h-2v-1.6h-1.6v1.6h-.8a2 2 0 1 0 0 4h3.2a.4.4 0 0 1 0 .8Z"
        fill={color || theme.iconPrimary}
      />
    </Svg>
  )
}

export default React.memo(AssetIcon)

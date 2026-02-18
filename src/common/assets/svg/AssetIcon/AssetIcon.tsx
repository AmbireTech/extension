import React, { FC } from 'react'
import { Path, Svg, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const AssetIcon: FC<SvgProps> = ({ width, height, color, ...rest }) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} viewBox="0 0 20 20" {...rest} fill="none">
      <Path
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        d="M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
      />
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M10 4v6m0 6v-6m-3 3.182.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C11.536 10.219 10.768 10 10 10m0 0c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33"
      />
    </Svg>
  )
}

export default React.memo(AssetIcon)

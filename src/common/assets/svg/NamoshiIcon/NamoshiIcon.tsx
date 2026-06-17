import React, { FC } from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const NamoshiIcon: FC<
  SvgProps & {
    isActive?: boolean
  }
> = ({ width = 24, height = 24, color, isActive, ...rest }) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} fill="none" {...rest} viewBox="0 0 24 24">
      <Path
        opacity={isActive ? '1' : '0.5'}
        fill={color || theme.iconPrimary}
        d="M6.073 14.177c1.856.238 3.9-.314 5.496-1.267 1.973-1.177 2.675-2.766 4.088-4.383s3.928-2.603 5.764-1.016c2.396 2.071 1.783 5.832.033 8.117-2.476 3.23-6.065 4.062-9.887 2.828-1.873-.605-3.734-2.319-5.06-3.753-.04-.044-.461-.505-.434-.525"
      />
      <Path
        opacity={isActive ? '1' : '0.5'}
        fill={color || theme.iconPrimary}
        d="M13.816 9.909c-1.45 1.903-3.412 3.382-5.851 3.638-2.985.313-6.174-1.669-6.84-4.688C.303 5.134 3.698 2.603 6.882 4.84c1.423 1 2.007 2.459 3.097 3.703 1.01 1.153 2.297 1.708 3.837 1.365"
      />
    </Svg>
  )
}

export default React.memo(NamoshiIcon)

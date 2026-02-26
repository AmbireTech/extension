import React, { FC } from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const UploadIcon: FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()

  return (
    <Svg fill="none" viewBox="0 0 32 32" width={width} height={height} {...rest}>
      <Path
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        d="M13.334 20H7.112c-2.454 0-4.445-1.971-4.445-4.4 0-2.43 1.99-4.4 4.444-4.4.521 0 .782 0 .971-.058.276-.084.406-.168.597-.382.13-.147.273-.462.56-1.093a7.413 7.413 0 0 1 6.76-4.334 7.414 7.414 0 0 1 6.763 4.334c.286.63.43.946.56 1.093.19.214.32.298.596.382.19.058.45.058.972.058 2.454 0 4.444 1.97 4.444 4.4 0 2.429-1.99 4.4-4.444 4.4h-6.222"
      />
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="1.5"
        d="m12 14.519 4-3.852m0 0 4 3.852m-4-3.852v16"
      />
    </Svg>
  )
}

export default React.memo(UploadIcon)

import React from 'react'
import Svg, { Circle, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const LedgerMiniIcon: React.FC<SvgProps> = ({ width = 57, height = 57, ...styles }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 32 32" {...styles}>
      <Circle cx="16" cy="16" r="16" fill={theme.secondaryBackgroundInverted} />
      <Path fill="none" d="M0 0h32v32H0z" />
      <Path
        d="M20.974 8.17h-6.8v9.173h9.173v-6.8a2.37 2.37 0 0 0-2.373-2.373Zm-8.916 0h-1.169a2.37 2.37 0 0 0-2.376 2.376v1.169h3.545Zm-3.545 5.663h3.545v3.545H8.513Zm11.33 9.173h1.17a2.37 2.37 0 0 0 2.376-2.376V19.5h-3.546ZM14.176 19.5h3.545v3.545h-3.545Zm-5.663 0v1.17a2.37 2.37 0 0 0 2.376 2.376h1.169V19.5Z"
        fill={theme.primaryBackground}
      />
    </Svg>
  )
}

export default React.memo(LedgerMiniIcon)

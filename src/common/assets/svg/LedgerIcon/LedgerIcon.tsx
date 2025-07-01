import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const LedgerIcon: React.FC<SvgProps> = ({ width = 57, height = 57, color }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 24 20.892">
      <Path
        d="M0,14.96v5.932H9.027V19.577H1.315V14.96Zm22.685,0v4.617H14.973v1.315H24V14.96ZM9.041,5.932V14.96h5.932V13.773H10.356V5.932ZM0,0V5.932H1.315V1.315H9.027V0ZM14.973,0V1.315h7.712V5.932H24V0Z"
        fill={color || theme.iconPrimary}
      />
    </Svg>
  )
}

export default React.memo(LedgerIcon)

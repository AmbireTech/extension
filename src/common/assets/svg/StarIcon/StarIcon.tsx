import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

interface Props extends SvgProps {
  width?: number
  height?: number
  isFilled?: boolean
}

const StarIcon: React.FC<Props> = ({ width = 16, height = 16, isFilled, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 16 16" {...rest}>
      <Path
        d="M19.842,9.1l-6.055-.522L11.421,3,9.055,8.583,3,9.1,7.6,13.08,6.217,19l5.2-3.141L16.625,19l-1.373-5.92Zm-8.421,5.187L8.255,16.2l.842-3.6L6.3,10.166l3.688-.32,1.432-3.394,1.44,3.4,3.688.32-2.8,2.425.842,3.6Z"
        transform="translate(-3 -3)"
        fill={color || theme.iconPrimary}
      />
      <Path
        d="M11.421,15.859,16.625,19l-1.381-5.92,4.6-3.983-6.055-.514L11.421,3,9.055,8.583,3,9.1,7.6,13.08,6.217,19Z"
        transform="translate(-3 -3)"
        fill={theme.warningDecorative2}
        opacity={isFilled ? '1' : '0'}
      />
    </Svg>
  )
}

export default React.memo(StarIcon)

import React from 'react'
import { ColorValue } from 'react-native'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

interface Props extends SvgProps {
  width?: number
  height?: number
  color?: ColorValue
  strokeWidth?: string
}

const OpenIcon: React.FC<Props> = ({
  width = 19,
  height = 19,
  color,
  strokeWidth = '1.5',
  ...rest
}) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 18.951 18.951" {...rest}>
      <G id="open" transform="translate(0.75 0.75)">
        <Path
          d="M13,9.955,20.156,2.8"
          transform="translate(-3.403 -2.102)"
          fill="none"
          stroke={color || theme.iconPrimary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
        />
        <Path
          d="M21.39,6.188V2H17.2"
          transform="translate(-3.939 -2)"
          fill="none"
          stroke={color || theme.iconPrimary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
        />
        <Path
          d="M9.855,2H8.109C3.747,2,2,3.745,2,8.108v5.235c0,4.363,1.745,6.108,6.108,6.108h5.235c4.363,0,6.108-1.745,6.108-6.108V11.6"
          transform="translate(-2.001 -2)"
          fill="none"
          stroke={color || theme.iconPrimary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
        />
      </G>
    </Svg>
  )
}

export default React.memo(OpenIcon)

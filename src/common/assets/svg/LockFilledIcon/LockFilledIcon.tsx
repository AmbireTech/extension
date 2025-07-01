import React from 'react'
import { ColorValue } from 'react-native'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

interface Props extends SvgProps {
  width?: number
  height?: number
  color?: ColorValue
}

const LockFilledIcon: React.FC<Props> = ({ width = 15, height = 22, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 15.1 21.454" {...rest}>
      <G id="lock" transform="translate(0.75 0.75)">
        <Path
          d="M-843.8,16857.627h0v-2.555a5.1,5.1,0,0,1,5.1-5.094,5.1,5.1,0,0,1,5.1,5.094v2.547l-3.9-1.258a4.236,4.236,0,0,0-1.208-.156,4.124,4.124,0,0,0-1.2.156l-3.9,1.266Z"
          transform="translate(845.5 -16849.979)"
          fill="none"
          stroke={color || theme.iconPrimary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <Path
          d="M9.008,2.156,5.063,3.434A2.4,2.4,0,0,0,3.41,5.481v5.053a3.173,3.173,0,0,0,1.368,2.34l3.4,2.183a4.089,4.089,0,0,0,4.064,0l3.4-2.183a3.173,3.173,0,0,0,1.368-2.34V5.481a2.4,2.4,0,0,0-1.653-2.054L11.412,2.156A4.647,4.647,0,0,0,9.008,2.156Z"
          transform="translate(-3.41 4.228)"
          fill={color || theme.iconPrimary}
          stroke={color || theme.iconPrimary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </G>
    </Svg>
  )
}

export default React.memo(LockFilledIcon)

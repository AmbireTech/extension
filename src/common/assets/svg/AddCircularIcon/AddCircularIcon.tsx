import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const AddCircularIcon: React.FC<SvgProps> = ({ width = 25, height = 25, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 25.301 25.301" {...rest}>
      <G transform="translate(0.65 0.65)">
        <Path
          d="M39,13a10.782,10.782,0,0,1-.36,2.79,11.2,11.2,0,0,1-1.38,3.39,11.7,11.7,0,0,1-6.51,5.19A11.058,11.058,0,0,1,27,25a11.763,11.763,0,0,1-7.98-3.09,11.051,11.051,0,0,1-2.28-2.73A11.763,11.763,0,0,1,15,13a12.161,12.161,0,0,1,.6-3.78,11.835,11.835,0,0,1,2.79-4.59A11.985,11.985,0,0,1,27,1a11.833,11.833,0,0,1,8.91,3.99A11.953,11.953,0,0,1,39,13Z"
          transform="translate(-15.002 -1)"
          fill="none"
          stroke={color || theme.iconPrimary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.3"
        />
        <Path
          d="M26.452,4.98h-8.94"
          transform="translate(-9.981 6.962)"
          fill="none"
          stroke={color || theme.iconPrimary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.3"
        />
        <Path
          d="M19,3.52v8.97"
          transform="translate(-7 4.042)"
          fill="none"
          stroke={color || theme.iconPrimary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.3"
        />
      </G>
    </Svg>
  )
}

export default React.memo(AddCircularIcon)

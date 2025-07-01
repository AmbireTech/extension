import React from 'react'
import Svg, { G, Line, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const PowerIcon: React.FC<SvgProps> = ({ width = 16, height = 16, color }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 16 16">
      <G transform="translate(-83 -8)">
        <G transform="translate(-0.8 -0.896)">
          <Path
            d="M9.8,1.229a5.935,5.935,0,0,1,2.2,4.7,6,6,0,0,1-12,0A6.062,6.062,0,0,1,2.248,1.291"
            transform="translate(85.8 11.367)"
            fill="none"
            stroke={color || theme.errorDecorative}
            strokeLinecap="round"
            strokeWidth="1.5"
          />
          <Line
            y2="4.433"
            transform="translate(91.8 10.5)"
            fill="none"
            stroke={color || theme.errorDecorative}
            strokeLinecap="round"
            strokeWidth="1.5"
          />
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(PowerIcon)

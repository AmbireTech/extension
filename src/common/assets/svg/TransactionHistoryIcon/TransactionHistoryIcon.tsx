import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const TransactionHistoryIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 19.779 19.5">
      <G
        fill="none"
        stroke={color || theme.iconSecondary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <G>
          <Path d="M12.328 18.45a9 9 0 0 0-2.3-17.7 11.071 11.071 0 0 0-9 5m0 0v-4.1m0 4.1h4" />
          <Path d="M1.028 9.75a9 9 0 0 0 9 9" strokeDasharray="3 3" />
        </G>
        <Path d="m13.699 12.612-2.79-1.665a1.993 1.993 0 0 1-.88-1.548v-3.69" />
      </G>
    </Svg>
  )
}

export default React.memo(TransactionHistoryIcon)

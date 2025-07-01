import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const EditPenIcon: React.FC<SvgProps> = ({ width = 16, height = 16, color }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 15.503 15.517">
      <G transform="translate(-7.652 -1.236)">
        <G transform="translate(8.405 2)">
          <Path
            d="M23.462,16.343,16.2,23.608a2.528,2.528,0,0,0-.616,1.211l-.39,2.77a1.3,1.3,0,0,0,1.56,1.56l2.771-.39a2.442,2.442,0,0,0,1.211-.616L28,20.878c1.252-1.252,1.847-2.709,0-4.556C26.171,14.5,24.714,15.091,23.462,16.343Z"
            transform="translate(-15.171 -15.167)"
            fill="none"
            stroke={color || theme.iconPrimary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <Path
            d="M18.7,16.25a6.538,6.538,0,0,0,4.557,4.556"
            transform="translate(-11.458 -14.028)"
            fill="none"
            stroke={color || theme.iconPrimary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(EditPenIcon)

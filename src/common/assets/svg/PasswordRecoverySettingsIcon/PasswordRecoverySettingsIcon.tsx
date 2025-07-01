import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const PasswordRecoverySettingsIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 22.058 21.5">
      <G transform="translate(18934.029 -1995.23)">
        <G transform="translate(-18927 2000.149)">
          <G>
            <Path
              d="M-843.8,16854.605h0v-1.545a3.051,3.051,0,0,1,3-3.086,3.052,3.052,0,0,1,3,3.086v1.543l-2.293-.764a2.4,2.4,0,0,0-.71-.09,2.336,2.336,0,0,0-.7.09l-2.292.766Z"
              transform="translate(844.83 -16849.975)"
              fill="none"
              stroke={color || theme.iconSecondary}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
            <Path
              d="M6.7,2.093l-2.321.774A1.445,1.445,0,0,0,3.41,4.106V7.165a1.932,1.932,0,0,0,.8,1.416l2,1.321a2.347,2.347,0,0,0,2.391,0l2-1.321a1.932,1.932,0,0,0,.8-1.416V4.106a1.446,1.446,0,0,0-.972-1.243l-2.321-.77A2.659,2.659,0,0,0,6.7,2.093Z"
              transform="translate(-3.41 1.77)"
              fill="none"
              stroke={color || theme.iconSecondary}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </G>
        </G>
        <Path
          d="M22,32A9.978,9.978,0,0,1,32,22a12.3,12.3,0,0,1,10,5.56m0,0v-5m0,5h-3.44"
          transform="translate(-18955.002 1973.98)"
          fill="none"
          stroke={color || theme.iconSecondary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <Path
          d="M42,22A9.978,9.978,0,0,1,32,32a12.3,12.3,0,0,1-10-5.56m0,0v5m0-5h3.44"
          transform="translate(-18955.002 1983.98)"
          fill="none"
          stroke={color || theme.iconSecondary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </G>
    </Svg>
  )
}

export default React.memo(PasswordRecoverySettingsIcon)

import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const LockIcon: React.FC<SvgProps> = ({ width = 18, height = 25.5, color }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 17.964 25.655">
      <Path
        fill="none"
        d="M9.031 22.085 7.648 20.7v-3.674a3.06 3.06 0 0 1-1.734-2.773 3.086 3.086 0 1 1 4.454 2.763v.33l-.539.539.539.764-.539.76.824.91-1.622 1.764Zm-.036-9.823a.994.994 0 1 0 .995.991.992.992 0 0 0-.995-.991Z"
      />
      <Path
        fill="none"
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M2.75 9.748v-3a6.124 6.124 0 0 1 6.232-6 6.124 6.124 0 0 1 6.233 6v2.994L10.452 8.26a5.378 5.378 0 0 0-1.476-.184 5.235 5.235 0 0 0-1.462.184L2.752 9.748Z"
      />
      <Path
        fill="none"
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M7.527 8.267 2.751 9.835a2.936 2.936 0 0 0-2 2.51v6.2a3.9 3.9 0 0 0 1.656 2.869l4.116 2.677a4.9 4.9 0 0 0 4.92 0l4.116-2.677a3.9 3.9 0 0 0 1.656-2.869v-6.2a2.937 2.937 0 0 0-2-2.518l-4.775-1.56a5.556 5.556 0 0 0-2.913 0Z"
      />
      <Path
        fill="none"
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M11.819 14.943a2.82 2.82 0 0 1-1.506 2.495l-.005 2.475a.721.721 0 0 1-.264.521l-.652.495a.7.7 0 0 1-.79 0l-.656-.491a.75.75 0 0 1-.262-.527v-2.475a2.819 2.819 0 1 1 4.135-2.493Z"
      />
      <Path fill="none" d="M9.097 19.012h1.21" />
      <Path
        fill={color || theme.iconPrimary}
        d="M9.574 15.485a.818.818 0 1 0-1.157-.001.818.818 0 0 0 1.157 0Z"
      />
    </Svg>
  )
}

export default React.memo(LockIcon)

import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const AccountsIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 20.625 21.31">
      <G id="Accounts_icon" transform="translate(-2328.688 -230.345)">
        <G id="Group_975" transform="translate(2327.091 229.095)">
          <Path
            id="Path_2184"
            d="M9.162,10.87a1.818,1.818,0,0,0-.33,0,4.445,4.445,0,1,1,.33,0Z"
            fill="none"
            stroke={color || theme.iconSecondary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <Path
            id="Path_2185"
            d="M16.411,4a3.5,3.5,0,0,1,.13,7,1.13,1.13,0,0,0-.26,0"
            fill="none"
            stroke={color || theme.iconSecondary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <Path
            id="Path_2186"
            d="M4.162,14.56c-2.42,1.62-2.42,4.26,0,5.87a9.766,9.766,0,0,0,10.01,0c2.42-1.62,2.42-4.26,0-5.87A9.812,9.812,0,0,0,4.162,14.56Z"
            fill="none"
            stroke={color || theme.iconSecondary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <Path
            id="Path_2187"
            d="M18.341,20a4.837,4.837,0,0,0,1.96-.87,2.533,2.533,0,0,0,0-4.27,4.973,4.973,0,0,0-1.93-.86"
            fill="none"
            stroke={color || theme.iconSecondary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(AccountsIcon)

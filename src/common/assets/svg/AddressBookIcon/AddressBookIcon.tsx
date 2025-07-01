import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const AddressBookIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 21.5 15.759">
      <G id="Address_book" transform="translate(-3.422 -4.516)">
        <G id="Group_985" transform="translate(4.172 5.266)">
          <Path
            id="Path_2195"
            d="M10.077,8.49H5.5"
            transform="translate(8.397 -5.455)"
            fill="none"
            stroke={color || theme.iconSecondary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <Path
            id="Path_2196"
            d="M11.6,11.49H5.5"
            transform="translate(8.397 -3.816)"
            fill="none"
            stroke={color || theme.iconSecondary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <Path
            id="Path_2200"
            d="M11.6,11.49H5.5"
            transform="translate(8.397 0.82)"
            fill="none"
            stroke={color || theme.iconSecondary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <Path
            id="Path_2198"
            d="M12.657,10.074h-.193a2.513,2.513,0,1,1,2.6-2.512A2.478,2.478,0,0,1,12.657,10.074Z"
            transform="translate(-7.739 -5.05)"
            fill="none"
            stroke={color || theme.iconSecondary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <Path
            id="Path_2199"
            d="M9.539,12.176a2.327,2.327,0,0,0,0,4.161,6.918,6.918,0,0,0,7.085,0,2.327,2.327,0,0,0,0-4.161A6.978,6.978,0,0,0,9.539,12.176Z"
            transform="translate(-8.254 -3.276)"
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

export default React.memo(AddressBookIcon)

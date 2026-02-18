import React from 'react'
import Svg, { Circle, Path, Rect, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const AddressBookIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...props }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 20 20" fill="none" {...props}>
      <Rect
        x="4.16663"
        y="3.33325"
        width="12.5"
        height="14.1667"
        rx="2"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
      />
      <Path
        d="M2.5 6.66675H5.83333"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M2.5 10H5.83333"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M2.5 13.3333H5.83333"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Circle
        cx="11.6668"
        cy="7.66667"
        r="1.91667"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M11.6667 11.6667C13.8004 11.6667 14.5683 13.0325 14.8447 14.0156C14.9941 14.5473 14.5523 15.0001 14 15.0001H9.33337C8.78109 15.0001 8.33929 14.5473 8.48876 14.0156C8.76513 13.0325 9.53303 11.6667 11.6667 11.6667Z"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  )
}

export default React.memo(AddressBookIcon)

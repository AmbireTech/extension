import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const WithdrawIcon: React.FC<Props> = ({ width = 30, height = 30, color, strokeWidth = '1' }) => {
  const { theme } = useTheme()
  const strokeColor = color || theme.iconSecondary

  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 14.75L12 17C10.6983 15.5355 11.3017 16.2145 10 14.75M12 17L12 11"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17.5 8.5V17C17.5 18.3807 16.3807 19.5 15 19.5H9C7.61929 19.5 6.5 18.3807 6.5 17V8.5H17.5Z"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      <Path
        d="M6 12C3.79086 12 2 10.2091 2 8C2 5.79086 3.79086 4 6 4H18C20.2091 4 22 5.79086 22 8C22 10.2091 20.2091 12 18 12"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
    </Svg>
  )
}

export default React.memo(WithdrawIcon)

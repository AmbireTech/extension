import React from 'react'
import Svg, { Circle, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const ExploreIcon: React.FC<SvgProps> = ({ width = 22, height = 22, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 17 17" {...rest}>
      <Circle
        cx="8.46429"
        cy="8.46429"
        r="7.71429"
        stroke={color || theme.iconPrimary}
        strokeWidth="1"
        fill="transparent"
      />
      <Path
        d="M11.8715 5.12006L10.4327 10.3958C10.428 10.4129 10.4147 10.4263 10.3976 10.4309L5.12181 11.8698C5.08448 11.8799 5.05023 11.8457 5.06041 11.8084L6.49926 6.5326C6.50392 6.51552 6.51726 6.50217 6.53434 6.49751L11.8101 5.05867C11.8474 5.04849 11.8817 5.08274 11.8715 5.12006Z"
        stroke={color || theme.iconPrimary}
        strokeWidth="1"
        strokeLinecap="round"
        fill="transparent"
      />
      <Path
        d="M8.46484 8.46436H8.47484"
        stroke={color || theme.iconPrimary}
        strokeWidth="1"
        strokeLinecap="round"
      />
    </Svg>
  )
}

export default React.memo(ExploreIcon)

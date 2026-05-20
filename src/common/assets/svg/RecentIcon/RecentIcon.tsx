import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const RecentIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 18 18" {...rest}>
      <Path
        d="M0.75 8.25C0.75 7.26509 0.943993 6.28982 1.3209 5.37987C1.69781 4.46993 2.25026 3.64314 2.9467 2.9467C3.64314 2.25026 4.46993 1.69781 5.37987 1.3209C6.28982 0.943993 7.26509 0.75 8.25 0.75C9.23491 0.75 10.2102 0.943993 11.1201 1.3209C12.0301 1.69781 12.8569 2.25026 13.5533 2.9467C14.2497 3.64314 14.8022 4.46993 15.1791 5.37987C15.556 6.28982 15.75 7.26509 15.75 8.25C15.75 9.23491 15.556 10.2102 15.1791 11.1201C14.8022 12.0301 14.2497 12.8569 13.5533 13.5533C12.8569 14.2497 12.0301 14.8022 11.1201 15.1791C10.2102 15.556 9.23491 15.75 8.25 15.75C7.26508 15.75 6.28982 15.556 5.37987 15.1791C4.46993 14.8022 3.64314 14.2497 2.9467 13.5533C2.25026 12.8569 1.69781 12.0301 1.3209 11.1201C0.943993 10.2102 0.75 9.23491 0.75 8.25L0.75 8.25Z"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M12 8.83757H8.5C8.36193 8.83757 8.25 8.72564 8.25 8.58757V5.9209"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  )
}

export default React.memo(RecentIcon)

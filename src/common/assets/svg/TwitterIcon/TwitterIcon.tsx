import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const TwitterIcon: React.FC<SvgProps> = ({ width = 32, height = 32, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" {...rest} fill="none">
      <Path
        d="M16.313 5H18.613L13.588 10.9L19.5 18.9285H14.871L11.246 14.059L7.096 18.9285H4.7965L10.1715 12.617L4.5 5.0005H9.246L12.523 9.4505L16.313 5ZM15.5065 17.5145H16.781L8.554 6.34H7.186L15.5065 17.5145Z"
        fill={color || theme.iconPrimary}
      />
    </Svg>
  )
}

export default React.memo(TwitterIcon)

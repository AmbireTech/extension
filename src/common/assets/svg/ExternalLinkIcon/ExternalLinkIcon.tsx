import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

type Props = SvgProps & {
  strokeWidth?: number | string
}

const ExternalLinkIcon: React.FC<Props> = ({
  width = 24,
  height = 24,
  color,
  strokeWidth = 1.5,
  ...rest
}) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        d="M14 4H20M20 4V10M20 4L12 12"
        stroke={color || theme.iconPrimary}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M11 5H7C5.89543 5 5 5.89543 5 7V17C5 18.1046 5.89543 19 7 19H17C18.1046 19 19 18.1046 19 17V13"
        stroke={color || theme.iconPrimary}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  )
}

export default React.memo(ExternalLinkIcon)

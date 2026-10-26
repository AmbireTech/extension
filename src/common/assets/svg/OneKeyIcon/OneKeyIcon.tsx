import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const OneKeyIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} viewBox="0 0 144 144" fill="none" {...rest}>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M144 0H0V144H144V0ZM58.4753 30.5305H78.5053V63.5381H66.0865V41.1562H54.9613L58.4753 30.5305ZM72.0004 113.469C84.6164 113.469 94.8437 103.242 94.8437 90.6261C94.8437 78.0101 84.6164 67.7828 72.0004 67.7828C59.3844 67.7828 49.1571 78.0101 49.1571 90.6261C49.1571 103.242 59.3844 113.469 72.0004 113.469ZM72.0004 103.099C78.8889 103.099 84.4731 97.5145 84.4731 90.626C84.4731 83.7375 78.8889 78.1533 72.0004 78.1533C65.1119 78.1533 59.5276 83.7375 59.5276 90.626C59.5276 97.5145 65.1119 103.099 72.0004 103.099Z"
        fill={color || theme.iconPrimary}
      />
    </Svg>
  )
}

export default React.memo(OneKeyIcon)

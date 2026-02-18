import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const StarIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} viewBox="0 0 20 20" {...rest} fill="none">
      <Path
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        d="M10 2.417c.022 0 .043.006.06.016.015.01.037.028.058.07l1.934 3.964c.231.474.675.819 1.204.907l4.203.699c.043.007.09.036.114.114a.2.2 0 0 1-.043.203l-3.008 3.15a1.708 1.708 0 0 0-.448 1.432l.663 4.397c.013.09-.023.152-.069.187a.125.125 0 0 1-.06.027.099.099 0 0 1-.059-.015l-3.794-2.018a1.605 1.605 0 0 0-1.51 0L5.45 17.568a.099.099 0 0 1-.06.015.124.124 0 0 1-.06-.027c-.046-.035-.081-.097-.068-.187l.663-4.397a1.708 1.708 0 0 0-.448-1.432L2.47 8.39a.2.2 0 0 1-.043-.203c.025-.078.071-.107.114-.114l4.203-.7c.53-.087.972-.432 1.203-.906L9.88 2.503a.158.158 0 0 1 .058-.07.117.117 0 0 1 .06-.016Z"
      />
    </Svg>
  )
}

export default React.memo(StarIcon)

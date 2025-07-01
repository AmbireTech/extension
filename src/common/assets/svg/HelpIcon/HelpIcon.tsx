import React from 'react'
import Svg, { G, Path, Rect, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const BugIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 19.5 19.5" {...rest}>
      <G transform="translate(-1229.25 -1384.924)">
        <Rect
          width="18"
          height="18"
          rx="6"
          transform="translate(1230 1385.674)"
          fill="none"
          stroke={color || theme.iconPrimary}
          strokeWidth="1.5"
        />
        <Path
          d="M1238.132 1396.9v-.482a2.843 2.843 0 0 1 .3-1.379 3.927 3.927 0 0 1 1.056-1.137 5.833 5.833 0 0 0 1.156-1.1 1.651 1.651 0 0 0 .26-.934 1.174 1.174 0 0 0-.422-.972 1.9 1.9 0 0 0-1.212-.339 4.169 4.169 0 0 0-1.326.2 9.413 9.413 0 0 0-1.19.49l-.633-1.323a6.632 6.632 0 0 1 3.277-.851 3.542 3.542 0 0 1 2.343.723 2.46 2.46 0 0 1 .866 2 2.844 2.844 0 0 1-.166 1.006 2.886 2.886 0 0 1-.5.84 8.089 8.089 0 0 1-1.161 1.036 4.435 4.435 0 0 0-.938.912 1.75 1.75 0 0 0-.237.972v.339Zm-.309 2.407a.992.992 0 0 1 1.108-1.141 1.1 1.1 0 0 1 .829.3 1.163 1.163 0 0 1 .286.84 1.2 1.2 0 0 1-.29.848 1.07 1.07 0 0 1-.825.313 1.071 1.071 0 0 1-.821-.305 1.2 1.2 0 0 1-.287-.855Z"
          fill={color || theme.iconPrimary}
        />
      </G>
    </Svg>
  )
}

export default React.memo(BugIcon)

import React from 'react'
import Svg, { G, Path, Rect, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const SendIcon: React.FC<SvgProps> = ({
  width = 24,
  height = 24,
  color,
  strokeWidth = '1.5',
  ...rest
}) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24" {...rest}>
      <G transform="translate(0.001 -0.778)">
        <Rect
          width={width}
          height={height}
          transform="translate(-0.001 24.778) rotate(-90)"
          fill="none"
        />
        <Path
          d="M19.639,4.213a1.748,1.748,0,0,1,1.634.356l.08.086A1.811,1.811,0,0,1,21.629,6.2a8.939,8.939,0,0,1-.255,1l-.407,1.252L18.52,15.795c-.306.918-.542,1.628-.747,2.152a4.255,4.255,0,0,1-.564,1.092l-.1.109a2.83,2.83,0,0,1-3.861.2l-.218-.2a3.7,3.7,0,0,1-.66-1.2c-.2-.524-.441-1.235-.747-2.152-.065-.195-.109-.326-.145-.422l-.092-.215a1.7,1.7,0,0,0-.6-.643l-.11-.064a4.558,4.558,0,0,0-.638-.236c-.918-.306-1.628-.542-2.152-.747A4.263,4.263,0,0,1,6.8,12.9l-.109-.1a2.829,2.829,0,0,1,0-4.079l.109-.1a4.258,4.258,0,0,1,1.092-.563c.524-.2,1.234-.441,2.152-.747L17.39,4.874l1.252-.407A8.908,8.908,0,0,1,19.639,4.213Z"
          transform="translate(-1.756 0.689)"
          fill="none"
          stroke={color || theme.iconSecondary}
          strokeWidth={strokeWidth}
        />
      </G>
    </Svg>
  )
}

export default React.memo(SendIcon)

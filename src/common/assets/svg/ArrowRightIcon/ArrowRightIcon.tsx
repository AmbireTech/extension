import React from 'react'
import Svg, { G, Path, Rect, SvgProps } from 'react-native-svg'

const ArrowRightIcon: React.FC<SvgProps> = ({ width = 32, height = 32, color, ...props }) => {
  return (
    <Svg width={32} height={32} viewBox="0 0 32 32" {...props}>
      <G transform="translate(-1225 976) rotate(-90)">
        <Rect width={width} height={height} rx={16} transform="translate(944 1225)" fill="#fff" />
        <G transform="translate(970 1231) rotate(90)">
          <Rect width={20} height={20} transform="translate(20 0) rotate(90)" fill="none" />
          <G transform="translate(4.358 4.07)">
            <Path
              d="M4,0,0,4M0,4,4,8M0,4H10.037"
              transform="translate(10.679 9.93) rotate(180)"
              fill="none"
              stroke={color || '#000'}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
            />
          </G>
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(ArrowRightIcon)

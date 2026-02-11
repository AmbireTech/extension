import React from 'react'
import Svg, { Mask, Path, Rect, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const GasTankIcon: React.FC<SvgProps> = ({ width = 32, height = 32, color, ...rest }) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...rest}>
      <Rect
        width="14"
        height="22"
        x=".75"
        y=".75"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        rx="2"
      />
      <Mask id="a" fill="#fff">
        <Path d="M11.614 10.285a4 4 0 1 0-7.728 0l1.464-.392a2.485 2.485 0 1 1 4.8 0l1.464.392Z" />
      </Mask>
      <Path
        stroke={color || theme.iconPrimary}
        strokeWidth="3"
        d="M11.614 10.285a4 4 0 1 0-7.728 0l1.464-.392a2.485 2.485 0 1 1 4.8 0l1.464.392Z"
        mask="url(#a)"
      />
      <Path
        fill={color || theme.iconPrimary}
        d="M11.374 5.166a.75.75 0 1 0-1.248-.832l.624.416.624.416ZM9.75 6.25l.624.416 1-1.5-.624-.416-.624-.416-1 1.5.624.416ZM23.244 4.314a.75.75 0 0 0-.988-1.128l.494.564.494.564Zm-3.24 1.838-.494-.564.494.564ZM14.75 19.75v.75h2.571V19H14.75v.75Zm4.571-2h.75V7.658h-1.5V17.75h.75Zm.683-11.598.494.565 2.746-2.403-.494-.564-.494-.564-2.745 2.402.493.564Zm-.683 1.506h.75c0-.36.156-.704.427-.941l-.494-.565-.494-.564a2.75 2.75 0 0 0-.939 2.07h.75Zm-2 12.092v.75a2.75 2.75 0 0 0 2.75-2.75h-1.5c0 .69-.56 1.25-1.25 1.25v.75Z"
      />
      <Path stroke={color || theme.iconPrimary} stroke-width="1.5" d="M.75 10h14" />
    </Svg>
  )
}

export default React.memo(GasTankIcon)

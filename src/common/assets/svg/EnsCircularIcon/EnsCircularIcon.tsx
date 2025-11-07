import React, { FC } from 'react'
import { Defs, LinearGradient, Path, Rect, Stop, Svg, SvgProps } from 'react-native-svg'

const EnsCircularIcon: FC<SvgProps> = ({ width = 16, height = 16 }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 18 18">
      <Defs>
        <LinearGradient id="a" y1=".548" x2="1" y2=".552" gradientUnits="objectBoundingBox">
          <Stop offset="0" stopColor="#513eff" />
          <Stop offset=".204" stopColor="#5157ff" />
          <Stop offset=".606" stopColor="#5298ff" />
          <Stop offset="1" stopColor="#52e5ff" />
        </LinearGradient>
      </Defs>
      <Rect width="18" height="18" rx="9" fill="url(#a)" />
      <Path
        d="M5.035 12.221a3.713 3.713 0 0 1-1.463-2.695q-.025-.247-.037-.496a7.518 7.518 0 0 1 .021-.876c.012-.078.026-.155.042-.232a4.262 4.262 0 0 1 .272-.847c.024-.056.05-.11.077-.165 0 0 .1-.188.146-.28a1.809 1.809 0 0 0 0 .529 3.279 3.279 0 0 0 .232.8 3.23 3.23 0 0 0 .151.3c.759 1.274 1.559 2.55 2.259 3.629 1.075 1.653 1.9 2.841 1.9 2.841Zm4 2.507 3.332-5.506v-.005s.289.491.406.741a2.349 2.349 0 0 1-.016 1.988 1.432 1.432 0 0 1-.464.509Zm4.568-3.948a1.683 1.683 0 0 0-.021-.264 3.236 3.236 0 0 0-.158-.617 3.3 3.3 0 0 0-.224-.485c-1.731-2.923-3.746-5.86-4.109-6.385l-.056-.083 3.608 2.509a3.706 3.706 0 0 1 1.461 2.691 7.625 7.625 0 0 1 .01 1.373 4.337 4.337 0 0 1-.1.477 4.211 4.211 0 0 1-.218.616l-.071.152s-.1.188-.146.278a1.69 1.69 0 0 0 .019-.261Zm-8.7-3.067a2.353 2.353 0 0 1 .016-1.987 1.416 1.416 0 0 1 .464-.509l3.263-2.271-3.343 5.509s-.292-.491-.406-.741Z"
        fill="#fff"
      />
    </Svg>
  )
}

export default React.memo(EnsCircularIcon)

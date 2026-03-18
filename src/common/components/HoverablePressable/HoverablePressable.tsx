import React, { FC } from 'react'

import useHover, { AnimatedPressable } from '@common/hooks/useHover'

type Props = {
  animationParams?: Parameters<typeof useHover>[0]
} & React.ComponentProps<typeof AnimatedPressable>

const HoverablePressable: FC<Props> = ({ animationParams = {}, ...rest }) => {
  const [bindAnim, animStyle] = useHover({
    preset: 'opacityInverted',
    ...animationParams
  })

  return <AnimatedPressable {...bindAnim} style={animStyle} {...rest} />
}

export default HoverablePressable

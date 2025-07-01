import React, { FC } from 'react'
import { G, Path, Svg, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const SuccessIcon: FC<SvgProps & { withCirc?: boolean }> = ({
  width = 24,
  height = 24,
  color,
  withCirc = true
}) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 21.5 21.5">
      {withCirc ? (
        <G
          fill="none"
          stroke={color || theme.iconSecondary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        >
          <Path d="M10.75 20.75a10 10 0 1 0-10-10 10.029 10.029 0 0 0 10 10Z" />
          <Path d="m6.5 10.75 2.83 2.83L15 7.92" />
        </G>
      ) : (
        <G
          fill="none"
          stroke={color || theme.iconSecondary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        >
          <Path d="m6.5 10.75 2.83 2.83L15 7.92" />
        </G>
      )}
    </Svg>
  )
}

export default React.memo(SuccessIcon)

import React from 'react'
import Svg, { G, Path, Rect, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const TwitterIcon: React.FC<SvgProps> = ({ width = 32, height = 32, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 32 32" {...rest}>
      <G transform="translate(-140 -459)">
        <Rect
          width="32"
          height="32"
          rx="6"
          transform="translate(140 459)"
          fill={theme.secondaryBackground}
        />
        <Path
          d="M164.1 471.16c.013.183.013.365.013.548 0 5.569-4.161 11.985-11.766 11.985a11.531 11.531 0 0 1-6.347-1.891 8.4 8.4 0 0 0 1 .052 8.186 8.186 0 0 0 5.134-1.8 4.153 4.153 0 0 1-3.866-2.921 5.122 5.122 0 0 0 .781.065 4.3 4.3 0 0 0 1.088-.143 4.194 4.194 0 0 1-3.318-4.136v-.051a4.107 4.107 0 0 0 1.869.535 4.271 4.271 0 0 1-1.28-5.634 11.685 11.685 0 0 0 8.527 4.408 4.84 4.84 0 0 1-.1-.965A4.173 4.173 0 0 1 159.97 467a4.091 4.091 0 0 1 3.021 1.33 8.052 8.052 0 0 0 2.625-1.017 4.188 4.188 0 0 1-1.816 2.321 8.171 8.171 0 0 0 2.381-.652 8.982 8.982 0 0 1-2.081 2.178Z"
          fill={color || theme.iconPrimary}
        />
      </G>
    </Svg>
  )
}

export default React.memo(TwitterIcon)

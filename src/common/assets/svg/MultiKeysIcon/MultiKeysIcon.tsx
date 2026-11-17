import React, { FC } from 'react'
import { G, Path, Svg, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const MultiKeysIcon: FC<SvgProps> = ({ width = 22.5, height = 24.5, color, ...rest }) => {
  const { theme } = useTheme()
  const strokeColor = color || theme.iconPrimary

  return (
    <Svg viewBox="0 0 22.486 24.508" width={width} height={height} {...rest}>
      <G
        fill="none"
        stroke={strokeColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <Path d="M3.69 14.73a.98.98 0 0 1-.143-.01l-1.525-.206a1.324 1.324 0 0 1-1.047-1.051L.764 11.94a1.415 1.415 0 0 1 .342-1.042l3.287-3.286a5.294 5.294 0 1 1 10.063.169 6.479 6.479 0 0 0-3.268 1.792 6.972 6.972 0 0 0-1.311 1.743 5.345 5.345 0 0 1-.418.016 5.248 5.248 0 0 1-1.576-.241l-3.289 3.29a1.352 1.352 0 0 1-.904.349Z" />
        <Path d="m4.177 11.576 1.61 1.61" />
        <Path d="M9.497 7.525A1.537 1.537 0 1 0 7.96 5.988a1.537 1.537 0 0 0 1.537 1.537Z" />
        <Path d="M20.19 18.804a5.3 5.3 0 0 1-5.314 1.307l-3.293 3.286a1.353 1.353 0 0 1-1.042.343l-1.524-.21a1.32 1.32 0 0 1-1.049-1.049l-.21-1.52a1.409 1.409 0 0 1 .343-1.042l3.286-3.29a5.294 5.294 0 1 1 8.8 2.174Z" />
        <Path d="m11.17 20.594 1.61 1.61" />
        <Path d="M16.491 16.543a1.537 1.537 0 1 0-1.537-1.537 1.537 1.537 0 0 0 1.537 1.537Z" />
      </G>
    </Svg>
  )
}

export default React.memo(MultiKeysIcon)

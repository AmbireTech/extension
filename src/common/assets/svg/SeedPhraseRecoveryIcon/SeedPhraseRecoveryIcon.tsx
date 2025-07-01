import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const SeedPhraseRecoveryIcon: React.FC<SvgProps> = ({
  width = 50,
  height = 50,
  color,
  ...rest
}) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 50 50" {...rest}>
      <G>
        <Path
          d="M16.916 26.182a.6.6 0 0 1-.54 1.072l-1.569-.664a.6.6 0 0 0-.833.5l-.177 2.263a.6.6 0 0 1-1.2 0l-.174-2.263a.6.6 0 0 0-.834-.506l-1.573.67a.6.6 0 0 1-.537-1.072l1.145-.662a.6.6 0 0 0 0-1.039l-1.14-.662a.6.6 0 0 1 .532-1.072l1.568.666a.6.6 0 0 0 .834-.506l.181-2.263a.6.6 0 0 1 1.2 0l.177 2.263a.6.6 0 0 0 .834.506l1.566-.666a.6.6 0 0 1 .54 1.072l-1.139.663a.6.6 0 0 0 0 1.039Z"
          fill={color || theme.iconPrimary}
        />
        <Path
          d="M28.717 26.182a.6.6 0 0 1-.54 1.072l-1.569-.664a.6.6 0 0 0-.833.5l-.177 2.263a.6.6 0 0 1-1.2 0l-.174-2.263a.6.6 0 0 0-.834-.506l-1.573.67a.6.6 0 0 1-.537-1.072l1.145-.662a.6.6 0 0 0 0-1.039l-1.14-.662a.6.6 0 0 1 .532-1.072l1.568.666a.6.6 0 0 0 .834-.506l.181-2.263a.6.6 0 0 1 1.2 0l.177 2.263a.6.6 0 0 0 .834.506l1.566-.666a.6.6 0 0 1 .54 1.072l-1.139.663a.6.6 0 0 0 0 1.039Z"
          fill={color || theme.iconPrimary}
        />
        <Path
          d="M40.518 26.182a.6.6 0 0 1-.54 1.072l-1.569-.664a.6.6 0 0 0-.833.5l-.177 2.263a.6.6 0 0 1-1.2 0l-.174-2.263a.6.6 0 0 0-.834-.506l-1.573.67a.6.6 0 0 1-.537-1.072l1.145-.662a.6.6 0 0 0 0-1.039l-1.14-.662a.6.6 0 0 1 .532-1.072l1.568.666a.6.6 0 0 0 .834-.506l.181-2.263a.6.6 0 0 1 1.2 0l.177 2.263a.6.6 0 0 0 .834.506l1.566-.666a.6.6 0 0 1 .54 1.072l-1.139.663a.6.6 0 0 0 0 1.039Z"
          fill={color || theme.iconPrimary}
        />
        <G>
          <G
            fill="none"
            stroke={color || theme.iconPrimary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          >
            <Path d="M49 32.201a16.788 16.788 0 0 1-16.8 16.8l2.52-4.2" />
            <Path d="M1 17.801a16.788 16.788 0 0 1 16.8-16.8l-2.52 4.2" />
          </G>
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(SeedPhraseRecoveryIcon)

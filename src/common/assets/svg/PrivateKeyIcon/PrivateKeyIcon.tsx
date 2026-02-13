import React from 'react'
import Svg, { Circle, ClipPath, Defs, G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const PrivateKeyIcon: React.FC<SvgProps> = ({
  width = 24,
  height = 24,
  color,
  strokeWidth = 1.5,
  ...rest
}) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" {...rest} fill="none">
      <G stroke={color || theme.iconPrimary} strokeWidth="1.5" clipPath="url(#private-key-icon)">
        <Path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
          d="M19.866 11.205a10.503 10.503 0 0 1-2.138 6.112 10.173 10.173 0 0 1-5.282 3.622 1.699 1.699 0 0 1-.9 0 10.173 10.173 0 0 1-5.283-3.622 10.503 10.503 0 0 1-2.138-6.112V7.252a2.19 2.19 0 0 1 .36-1.102c.216-.327.517-.587.868-.753l4.92-2.053a4.501 4.501 0 0 1 3.454 0l4.92 2.053c.35.168.65.428.865.755.217.327.342.707.363 1.1l-.009 3.953Z"
        />
        <Circle cx="10.256" cy="13.513" r="2.256" />
        <Path strokeLinecap="round" d="m11.949 11.82 1.974-1.974M14.77 9l-.846.846m0 0 1.41 1.41" />
      </G>
      <Defs>
        <ClipPath id="private-key-icon">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

export default React.memo(PrivateKeyIcon)

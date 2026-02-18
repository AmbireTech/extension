import React from 'react'
import Svg, { ClipPath, Defs, G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const SeedPhraseIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" {...rest} fill="none">
      <G
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        clipPath="url(#seed-phrase-icon)"
      >
        <Path d="M19.866 11.205a10.503 10.503 0 0 1-2.138 6.112 10.173 10.173 0 0 1-5.282 3.622 1.699 1.699 0 0 1-.9 0 10.173 10.173 0 0 1-5.283-3.622 10.503 10.503 0 0 1-2.138-6.112V7.252a2.19 2.19 0 0 1 .36-1.102c.216-.327.517-.587.868-.753l4.92-2.053a4.501 4.501 0 0 1 3.454 0l4.92 2.053c.35.168.65.428.865.755.217.327.342.707.363 1.1l-.009 3.953Z" />
        <Path d="M12.005 11.029h-.114a1.546 1.546 0 0 1-1.075-.496 1.607 1.607 0 0 1-.427-1.122c.008-.416.175-.813.467-1.104a1.544 1.544 0 0 1 1.092-.456c.409 0 .8.164 1.092.456a1.606 1.606 0 0 1 .04 2.226c-.28.302-.666.48-1.075.496ZM10.248 13.55a1.158 1.158 0 0 0-.466.432 1.188 1.188 0 0 0 0 1.235c.112.185.274.334.466.431a3.372 3.372 0 0 0 3.507 0c.191-.097.353-.246.466-.431a1.187 1.187 0 0 0 0-1.235 1.157 1.157 0 0 0-.466-.432 3.372 3.372 0 0 0-3.507 0Z" />
      </G>
      <Defs>
        <ClipPath id="seed-phrase-icon">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

export default React.memo(SeedPhraseIcon)

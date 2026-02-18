import React from 'react'
import Svg, { ClipPath, Defs, G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const AddFromCurrentRecoveryPhraseIcon: React.FC<SvgProps> = ({
  width = 24,
  height = 24,
  color,
  ...rest
}) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" {...rest} fill="none">
      <G
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="1.5"
        clipPath="url(#add-from-recovery-phrase)"
      >
        <Path
          strokeLinejoin="round"
          d="M13.727 3.344a4.501 4.501 0 0 0-3.454 0l-4.92 2.053a2.131 2.131 0 0 0-.868.753 2.19 2.19 0 0 0-.36 1.102v3.953c.054 2.218.803 4.36 2.138 6.112a10.173 10.173 0 0 0 5.282 3.622c.295.081.606.081.901 0 2.095-.6 3.946-1.87 5.282-3.622a10.503 10.503 0 0 0 2.138-6.112V9"
        />
        <Path
          strokeLinejoin="round"
          d="M12.005 11.029h-.115a1.546 1.546 0 0 1-1.075-.496 1.606 1.606 0 0 1-.426-1.122c.008-.416.175-.813.467-1.104a1.544 1.544 0 0 1 1.092-.456c.409 0 .8.164 1.092.456a1.606 1.606 0 0 1 .04 2.226c-.28.302-.666.48-1.075.496ZM10.248 13.55a1.158 1.158 0 0 0-.466.432 1.188 1.188 0 0 0 0 1.235c.112.185.274.334.466.431a3.372 3.372 0 0 0 3.507 0c.191-.097.353-.246.466-.431a1.188 1.188 0 0 0 0-1.235 1.158 1.158 0 0 0-.466-.432 3.372 3.372 0 0 0-3.507 0Z"
        />
        <Path d="M18 3v4M20 5h-4" />
      </G>
      <Defs>
        <ClipPath id="add-from-recovery-phrase">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

export default React.memo(AddFromCurrentRecoveryPhraseIcon)

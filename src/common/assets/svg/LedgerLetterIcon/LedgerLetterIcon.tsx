import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const LedgerLetterIcon: React.FC<SvgProps> = ({ width = 57, height = 57, color }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 148 128" fill="none">
      <Path
        fill={color || theme.iconPrimary}
        d="M0 91.6548V128H55.3076V119.94H8.05844V91.6548H0ZM138.98 91.6548V119.94H91.7313V127.998H147.039V91.6548H138.98ZM55.388 36.3452V91.6529H91.7313V84.3842H63.4464V36.3452H55.388ZM0 0V36.3452H8.05844V8.05844H55.3076V0H0ZM91.7313 0V8.05844H138.98V36.3452H147.039V0H91.7313Z"
      />
    </Svg>
  )
}

export default React.memo(LedgerLetterIcon)

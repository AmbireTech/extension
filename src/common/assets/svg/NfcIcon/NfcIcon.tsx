import React, { FC, memo } from 'react'
import { Path, Svg } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'
import { LegendsSvgProps } from '@legends/types/svg'

const NfcIcon: FC<LegendsSvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  const stroke = color || theme.iconPrimary

  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        stroke={stroke}
        strokeWidth="1.5"
        d="M12 2.75a9.25 9.25 0 1 1 0 18.5 9.25 9.25 0 0 1 0-18.5Z"
      />
      <Path stroke={stroke} strokeWidth="1.2" strokeLinecap="round" d="M8.93 9.7a3 3 0 0 1 0 4.6" />
      <Path
        stroke={stroke}
        strokeWidth="1.2"
        strokeLinecap="round"
        d="M10.7 7.6a5.75 5.75 0 0 1 0 8.8"
      />
      <Path
        stroke={stroke}
        strokeWidth="1.2"
        strokeLinecap="round"
        d="M12.47 5.49a8.5 8.5 0 0 1 0 13.02"
      />
    </Svg>
  )
}

export default memo(NfcIcon)

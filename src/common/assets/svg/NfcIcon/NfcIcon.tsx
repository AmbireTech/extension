import React, { FC, memo } from 'react'
import { Path, Svg } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'
import { LegendsSvgProps } from '@legends/types/svg'

// TODO: placeholder contactless mark drawn to match the icon set's stroke style.
// Please replace it with the designed NFC icon when there is one.
const NfcIcon: FC<LegendsSvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  const stroke = color || theme.iconPrimary

  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        d="M7.5 9.25C8.16 10.06 8.55 11.02 8.55 12C8.55 12.98 8.16 13.94 7.5 14.75"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M11 6.5C12.13 7.94 12.8 9.83 12.8 12C12.8 14.17 12.13 16.06 11 17.5"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M14.5 3.75C16.11 5.99 17.05 8.86 17.05 12C17.05 15.14 16.11 18.01 14.5 20.25"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  )
}

export default memo(NfcIcon)

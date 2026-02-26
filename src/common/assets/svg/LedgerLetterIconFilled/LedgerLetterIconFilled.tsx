import React, { FC } from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const LedgerLetterIconFilled: FC<SvgProps> = ({ width = 96, height = 96, color, ...rest }) => {
  return (
    <Svg fill="none" viewBox="0 0 96 96" width={width} height={height} {...rest}>
      <Path
        fill={color || '#000'}
        d="M48 88c22.091 0 40-17.909 40-40S70.091 8 48 8 8 25.909 8 48s17.909 40 40 40Z"
      />
      <Path
        stroke="#fff"
        stroke-width="2"
        d="M43.556 64.889H28v-8.89M43.556 31.11H28V40M44.89 39.11v15.556h8.888M52.444 31.11H68V40M52.444 64.889H68v-8.89"
      />
    </Svg>
  )
}

export default React.memo(LedgerLetterIconFilled)

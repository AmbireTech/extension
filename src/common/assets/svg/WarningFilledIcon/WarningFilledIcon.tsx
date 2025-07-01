import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const WarningFilledIcon: React.FC<SvgProps> = ({ width = 20, height = 20, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 20.88 19.63" {...rest}>
      <Path
        d="M188.76,35.92l-6.4-11.52a3.552,3.552,0,0,0-6.72,0l-6.4,11.52a3.96,3.96,0,0,0-.25,3.99,3.936,3.936,0,0,0,3.61,1.72h12.8a3.936,3.936,0,0,0,3.61-1.72A3.959,3.959,0,0,0,188.76,35.92ZM178.25,29a.75.75,0,0,1,1.5,0v5a.75.75,0,0,1-1.5,0Zm1.46,8.71-.15.12a.757.757,0,0,1-.18.09.6.6,0,0,1-.19.06A1.225,1.225,0,0,1,179,38a1.5,1.5,0,0,1-.2-.02.636.636,0,0,1-.18-.06.757.757,0,0,1-.18-.09l-.15-.12a1.014,1.014,0,0,1,0-1.42l.15-.12a.757.757,0,0,1,.18-.09.636.636,0,0,1,.18-.06.856.856,0,0,1,.39,0,.6.6,0,0,1,.19.06.757.757,0,0,1,.18.09l.15.12a1.014,1.014,0,0,1,0,1.42Z"
        transform="translate(-168.56 -22)"
        fill={theme.warningDecorative}
      />
    </Svg>
  )
}

export default React.memo(WarningFilledIcon)

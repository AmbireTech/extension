import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const ExtensionsIcon: React.FC<SvgProps> = ({ width = 22, height = 22, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 31.5 32.5" {...rest}>
      <G
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.25"
      >
        <Path
          d="M29.111,15.614H26.994V9.968a2.831,2.831,0,0,0-2.823-2.823H18.526V5.029a3.529,3.529,0,1,0-7.057,0V7.146H5.823A2.819,2.819,0,0,0,3.014,9.968v5.363h2.1a3.811,3.811,0,1,1,0,7.622H3v5.363A2.831,2.831,0,0,0,5.823,31.14h5.363V29.023a3.811,3.811,0,1,1,7.622,0V31.14h5.363a2.831,2.831,0,0,0,2.823-2.823V22.671h2.117a3.529,3.529,0,0,0,0-7.057Z"
          transform="translate(-2 0)"
          fill="transparent"
        />
      </G>
    </Svg>
  )
}

export default React.memo(ExtensionsIcon)

import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const AddIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" {...rest}>
      <Path
        d="M10,11a1,1,0,0,1-.707-.293l-10-10a1,1,0,0,1,0-1.414,1,1,0,0,1,1.414,0l10,10A1,1,0,0,1,10,11Z"
        transform="translate(12 4.929) rotate(45)"
        fill={color || theme.iconPrimary}
      />
      <Path
        d="M0,11a1,1,0,0,1-.707-.293,1,1,0,0,1,0-1.414l10-10a1,1,0,0,1,1.414,0,1,1,0,0,1,0,1.414l-10,10A1,1,0,0,1,0,11Z"
        transform="translate(12 4.929) rotate(45)"
        fill={color || theme.iconPrimary}
      />
    </Svg>
  )
}

export default React.memo(AddIcon)

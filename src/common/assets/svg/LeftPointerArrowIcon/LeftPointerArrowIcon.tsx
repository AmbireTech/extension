import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

interface Props extends SvgProps {}

const LeftPointerArrowIcon: React.FC<Props> = ({ color, ...props }) => {
  const { theme } = useTheme()
  return (
    <Svg width="26.849" height="23.001" viewBox="0 0 26.849 23.001" {...props}>
      <Path
        d="M10.938.561,8.461,3.04l0,0L5.128,6.371,1.354,10.144c-.014.016-.028.029-.041.043L0,11.5v0l1.354,1.354,9.584,9.584a1.916,1.916,0,1,0,2.71-2.71l-2.477-2.479L7.158,13.239H25.006a1.918,1.918,0,0,0,0-3.833H7.517l.323-.323L11.171,5.75l2.477-2.479a1.916,1.916,0,1,0-2.71-2.71Z"
        transform="translate(26.849 23.001) rotate(180)"
        fill={color || theme.iconPrimary}
      />
    </Svg>
  )
}

export default React.memo(LeftPointerArrowIcon)

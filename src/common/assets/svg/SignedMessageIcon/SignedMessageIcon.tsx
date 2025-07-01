import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const SignedMessageIcon: React.FC<SvgProps> = ({ width = 21.5, height = 21.5, color }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 21.5 21.5">
      <G fill="none" stroke={color || theme.iconSecondary} strokeLinecap="round" strokeWidth="1.5">
        <Path d="M6.996 20.754s1.139-13.5 13.754-18.85c-.865 11.127-5.027 16.852-12.586 15.387" />
        <Path d="M20.086 6.521s-.781 1.812-3.684 2.013" />
        <Path d="M18.069 12.66s-1.795 1.132-5.023.352" />
        <Path d="M14.911.75H2.587A1.914 1.914 0 0 0 .75 2.733v8.923a1.914 1.914 0 0 0 1.837 1.983h1.455" />
        <Path d="M4.883 4.559h5.511" />
        <Path d="M4.883 7.194h3.674" />
      </G>
    </Svg>
  )
}

export default React.memo(SignedMessageIcon)

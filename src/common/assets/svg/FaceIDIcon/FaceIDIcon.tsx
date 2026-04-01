import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const FaceIDIcon: React.FC<SvgProps> = ({ width = 64, height = 64, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none" {...rest}>
      <Path
        d="M20.2676 21.3335V28.0002"
        stroke={color || theme.iconPrimary}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M43.1992 21.3335V28.0002"
        stroke={color || theme.iconPrimary}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M28 34.6668L29 34.6668C30.4142 34.6668 31.1213 34.6668 31.5607 34.2275C32 33.7882 32 33.0811 32 31.6668L32 21.3335"
        stroke={color || theme.iconPrimary}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M21.9492 42.6665C24.6963 44.8873 28.1932 46.2173 32.0008 46.2173C35.8084 46.2173 39.3054 44.8873 42.0525 42.6665"
        stroke={color || theme.iconPrimary}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M21.332 7.99968H10.9987C9.58448 7.99968 8.87738 7.99968 8.43804 8.43902C7.9987 8.87835 7.9987 9.58546 7.9987 10.9997V21.333"
        stroke={color || theme.iconPrimary}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M21.332 55.9998H10.9987C9.58448 55.9998 8.87738 55.9998 8.43804 55.5605C7.9987 55.1212 7.9987 54.4141 7.9987 52.9998V42.6665"
        stroke={color || theme.iconPrimary}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M42.666 7.99968H52.9994C54.4136 7.99968 55.1207 7.99968 55.56 8.43902C55.9993 8.87835 55.9993 9.58546 55.9993 10.9997V21.333"
        stroke={color || theme.iconPrimary}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M42.666 55.9998H52.9994C54.4136 55.9998 55.1207 55.9998 55.56 55.5605C55.9993 55.1212 55.9993 54.4141 55.9993 52.9998V42.6665"
        stroke={color || theme.iconPrimary}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  )
}

export default React.memo(FaceIDIcon)

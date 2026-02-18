import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const SignedMessageIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth="1.5"
        d="M12 4C8.229 4 6.343 4 5.172 5.172 4 6.343 4 8.229 4 12v6c0 .943 0 1.414.293 1.707C4.586 20 5.057 20 6 20h6c3.771 0 5.657 0 6.828-1.172C20 17.657 20 15.771 20 12"
      />
      <Path
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M8 15h8M8 11h3M18.775 3.42l1.071-1.071a1.19 1.19 0 0 1 1.684 1.683l-4.62 4.621c-.336.336-.75.582-1.205.718L14 9.879l.508-1.705c.135-.455.382-.869.718-1.205l3.549-3.549Zm0 0 1.675 1.675"
      />
    </Svg>
  )
}

export default React.memo(SignedMessageIcon)

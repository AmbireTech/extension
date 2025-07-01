import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const SettingsIcon: React.FC<SvgProps> = ({
  width = 24,
  height = 24,
  strokeWidth = '1.5',
  color,
  ...rest
}) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" {...rest}>
      <Path fill="none" d="M0 0h24v24H0z" />
      <Path
        d="M20.83 14.6a3 3 0 0 1 0-5.2.332.332 0 0 0 .12-.46l-1.67-2.88a.32.32 0 0 0-.28-.17.337.337 0 0 0-.17.05 3.019 3.019 0 0 1-4.52-2.6.335.335 0 0 0-.33-.34h-3.96a.335.335 0 0 0-.33.34 3.019 3.019 0 0 1-4.52 2.6.319.319 0 0 0-.45.12L3.04 8.94A.317.317 0 0 0 3 9.1a.352.352 0 0 0 .17.3 2.99 2.99 0 0 1 1.5 2.59 3.022 3.022 0 0 1-1.49 2.61h-.01a.332.332 0 0 0-.12.46l1.67 2.88a.32.32 0 0 0 .28.17.337.337 0 0 0 .17-.05 3.042 3.042 0 0 1 3.02.01 3 3 0 0 1 1.49 2.59.337.337 0 0 0 .34.34h3.96a.335.335 0 0 0 .33-.34 3.019 3.019 0 0 1 4.52-2.6.319.319 0 0 0 .45-.12l1.68-2.88a.317.317 0 0 0 .04-.16.352.352 0 0 0-.17-.3ZM12 15a3 3 0 1 1 3-3 3 3 0 0 1-3 3Z"
        fill="none"
        stroke={color || theme.iconPrimary}
        strokeWidth={strokeWidth}
      />
    </Svg>
  )
}

export default React.memo(SettingsIcon)

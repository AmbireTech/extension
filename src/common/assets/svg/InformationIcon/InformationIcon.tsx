import React from 'react'
import Svg, { G, Path } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const InformationIcon: React.FC<any> = ({ color, width = 14.999, height = 15, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 14.999 15" {...rest}>
      <G transform="translate(-1001.549 -1609.504)">
        <G transform="translate(1018.049 1626.004) rotate(180)">
          <Path
            id="information-icon-path"
            d="M7.5,15A7.5,7.5,0,1,1,15,7.5,7.508,7.508,0,0,1,7.5,15Zm0-6a.75.75,0,1,0,.75.751A.751.751,0,0,0,7.5,9Zm0-6a.751.751,0,0,0-.75.75V7.5a.75.75,0,0,0,1.5,0V3.75A.751.751,0,0,0,7.5,3Z"
            transform="translate(1.5 1.5)"
            fill={color || theme.iconSecondary}
          />
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(InformationIcon)

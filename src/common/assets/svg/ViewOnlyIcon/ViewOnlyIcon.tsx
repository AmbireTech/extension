import React, { FC } from 'react'
import { Circle, G, Path, Svg, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const ViewOnlyIcon: FC<SvgProps> = ({
  width = 65,
  height = 42,
  color,
  strokeWidth = 2,
  ...rest
}) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 65.521 42.724" {...rest}>
      <G
        fill="none"
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeWidth={strokeWidth}
      >
        <Path d="M50.1 41.724a14.421 14.421 0 0 1-14.159-11.68h0a3.216 3.216 0 0 0-6.36 0h0a14.294 14.294 0 0 1-1.764 4.632A14.421 14.421 0 1 1 4.44 17.958L15.269 4.514a8.555 8.555 0 0 1 2.953-2.555 8.479 8.479 0 0 1 12.3 6.229 3.4 3.4 0 0 1 2.143-.758h.2A3.394 3.394 0 0 1 35 8.188a8.476 8.476 0 0 1 15.254-3.672L61.444 18.4h0A14.414 14.414 0 0 1 50.1 41.724Zm.292-23.967a9.548 9.548 0 1 0 9.548 9.548 9.559 9.559 0 0 0-9.545-9.548Zm-34.878 0a9.548 9.548 0 1 0 9.548 9.548 9.559 9.559 0 0 0-9.546-9.548Z" />
        <G transform="translate(29.261 16.361)">
          <Circle cx="3.5" cy="3.5" r="3.5" stroke="none" />
          <Circle cx="3.5" cy="3.5" r="2.5" />
        </G>
        <Path d="M15.245 21.357a5.947 5.947 0 0 1 5.947 5.947" />
        <Path d="M50.245 21.357a5.947 5.947 0 0 1 5.947 5.947" />
      </G>
    </Svg>
  )
}

export default React.memo(ViewOnlyIcon)

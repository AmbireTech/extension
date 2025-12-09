import React, { FC } from 'react'
import { Path, Svg } from 'react-native-svg'

import { LegendsSvgProps } from '@legends/types/svg'

const LightningIcon: FC<LegendsSvgProps> = ({
  width = 24,
  height = 24,
  color = '#54597A',
  ...rest
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        d="M11.5 14H9.23607C7.78569 14 7.0605 14 6.76738 13.5257C6.47427 13.0515 6.79858 12.4028 7.44721 11.1056L11.0528 3.89443C11.4275 3.14497 11.6149 2.77025 11.8074 2.8157C12 2.86116 12 3.28012 12 4.11803V9.5C12 9.7357 12 9.85355 12.0732 9.92678C12.1464 10 12.2643 10 12.5 10H14.7639C16.2143 10 16.9395 10 17.2326 10.4743C17.5257 10.9485 17.2014 11.5972 16.5528 12.8944L12.9472 20.1056C12.5725 20.855 12.3851 21.2298 12.1926 21.1843C12 21.1388 12 20.7199 12 19.882V14.5C12 14.2643 12 14.1464 11.9268 14.0732C11.8536 14 11.7357 14 11.5 14Z"
        fill={color}
      />
    </Svg>
  )
}

export default LightningIcon

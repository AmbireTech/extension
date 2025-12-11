import React, { FC } from 'react'
import { Path, Svg } from 'react-native-svg'

import { LegendsSvgProps } from '@legends/types/svg'

const AsteriskIcon: FC<LegendsSvgProps> = ({
  width = 24,
  height = 24,
  color = '#54597A',
  ...rest
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        d="M9.1 19.6987L6.10926 17.5779L8.21852 14.7085L9.88704 12.7748L7.36852 12.2133L4 11.1217L5.13333 7.65974L8.53333 8.75136L10.8944 9.74941L10.6741 7.2231V3.69873H14.3259V7.2231L14.1056 9.74941L16.4667 8.75136L19.8667 7.65974L21 11.1217L17.6315 12.2133L15.113 12.7748L16.7815 14.7085L18.8907 17.5467L15.9 19.6987L13.7907 16.8605L12.5 14.6773L11.1778 16.8293L9.1 19.6987Z"
        fill={color}
      />
    </Svg>
  )
}

export default AsteriskIcon

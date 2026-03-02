import React from 'react'
import { ViewStyle } from 'react-native'

import Toggle from '@common/components/Toggle'
import { ToggleProps } from '@common/components/Toggle/types'
import { isWeb } from '@common/config/env'

const FatToggle: React.FC<
  ToggleProps & {
    width?: number
    height?: number
  }
> = ({ width = 52, height = 28, ...props }) => {
  return (
    <Toggle
      {...props}
      trackStyle={{
        width: width,
        height: height,
        borderRadius: 16,
        ...(props.trackStyle as ViewStyle) // TODO: Figure out the mismatch between types
      }}
      toggleStyle={{
        top: isWeb ? 2 : -2,
        width: height - 4,
        height: height - 4,
        transform: isWeb
          ? ((props.isOn ? `translateX(${width / 2}px)` : 'translateX(2px)') as any)
          : [{ translateX: props.isOn ? width / 2 - 4 : -2 }],
        ...(props.toggleStyle as ViewStyle)
      }}
    />
  )
}

export default React.memo(FatToggle)

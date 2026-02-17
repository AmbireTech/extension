import React from 'react'
import { ViewStyle } from 'react-native'

import Toggle from '@common/components/Toggle'
import { ToggleProps } from '@common/components/Toggle/types'

const FatToggle: React.FC<ToggleProps> = (props) => {
  return (
    <Toggle
      {...props}
      trackStyle={{
        width: 52,
        height: 28,
        borderRadius: 16,
        ...(props.trackStyle as ViewStyle) // TODO: Figure out the mismatch between types
      }}
      toggleStyle={{
        top: 2,
        width: 24,
        height: 24,
        transform: (props.isOn ? 'translateX(26px)' : 'translateX(2px)') as any,
        ...(props.toggleStyle as ViewStyle)
      }}
    />
  )
}

export default React.memo(FatToggle)

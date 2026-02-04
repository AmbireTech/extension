import React from 'react'

import Toggle from '@common/components/Toggle'
import { ToggleProps } from '@common/components/Toggle/types'

const FatToggle: React.FC<ToggleProps> = (props) => {
  return (
    <Toggle
      {...props}
      trackStyle={{
        width: 52,
        height: 28,
        // @ts-ignore mismatch between types
        borderRadius: 16,
        ...props.trackStyle
      }}
      toggleStyle={{
        top: 2,
        width: 24,
        height: 24,
        transform: (props.isOn ? 'translateX(26px)' : 'translateX(2px)') as any,
        // @ts-ignore mismatch between types
        ...props.toggleStyle
      }}
    />
  )
}

export default React.memo(FatToggle)

import React from 'react'
import { DimensionValue, ViewStyle } from 'react-native'

import Toggle from '@common/components/Toggle'
import { ToggleProps } from '@common/components/Toggle/types'
import useTheme from '@common/hooks/useTheme'
import { THEME_TYPES } from '@common/styles/themeConfig'

const FatToggle: React.FC<ToggleProps> = (props) => {
  const { theme } = useTheme()

  return (
    <Toggle
      {...props}
      trackStyle={
        {
          width: 52,
          height: 28,
          borderRadius: 16,
          ...props.trackStyle
        } as ViewStyle // ignore mismatch between types
      }
      toggleStyle={
        {
          top: 2,
          width: 24,
          height: 24,
          transform: (props.isOn ? 'translateX(26px)' : 'translateX(2px)') as any,
          border: `1px solid ${theme.secondaryBorder as string}`,
          ...props.toggleStyle
        } as ViewStyle // ignore mismatch between types
      }
    />
  )
}

export default React.memo(FatToggle)

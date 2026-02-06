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
        transform: props.isOn ? 'translateX(26px)' : 'translateX(2px)',
        borderWidth: 1,
        borderColor: theme.secondaryBorder,
        borderStyle: 'solid',
        ...(props.toggleStyle as ViewStyle) // TODO: Figure out the mismatch between types
      }}
    />
  )
}

export default React.memo(FatToggle)

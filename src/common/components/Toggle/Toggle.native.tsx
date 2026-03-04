/* eslint-disable react/no-unused-prop-types */
import React, { ReactNode } from 'react'
import { View, ViewStyle } from 'react-native'
import ToggleSwitch from 'toggle-switch-react-native'

import Text, { Props as TextProps } from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import { ToggleProps } from './types'

interface Props extends Omit<ToggleProps, 'toggleStyle' | 'trackStyle'> {
  labelProps?: TextProps
  toggleStyle?: ViewStyle
  trackStyle?: ViewStyle
  children?: ReactNode
}

const Toggle = ({ isOn, onToggle, label, style, disabled, trackStyle, toggleStyle }: Props) => {
  const { theme } = useTheme()

  return (
    <View style={[spacings.mrSm, flexbox.alignCenter, flexbox.directionRow, style]}>
      <ToggleSwitch
        isOn={isOn}
        disabled={disabled}
        onToggle={onToggle}
        thumbOnStyle={{
          width: 16,
          height: 16,
          borderRadius: 50,
          backgroundColor: String(theme.neutral300),
          transform: [{ translateX: 10 }],
          ...toggleStyle
        }}
        thumbOffStyle={{
          width: 16,
          height: 16,
          borderRadius: 50,
          backgroundColor: String(theme.neutral300),
          transform: [{ translateX: -4 }],
          ...toggleStyle
        }}
        trackOnStyle={{
          width: 28,
          height: 12,
          padding: 0,
          ...spacings.mrSm,
          backgroundColor: hexToRgba(String(theme.success400)),
          ...trackStyle
        }}
        trackOffStyle={{
          width: 28,
          height: 12,
          padding: 0,
          ...spacings.mrSm,
          backgroundColor: hexToRgba(String(theme.neutral600)),
          ...trackStyle
        }}
        hitSlop={{ top: 15, bottom: 15, left: 5, right: 5 }}
      />
      {!!label && <Text style={spacings.mrTy}>{label}</Text>}
    </View>
  )
}

export default React.memo(Toggle)

/* eslint-disable react/no-unused-prop-types */
import React, { ReactNode } from 'react'
import { View, ViewStyle } from 'react-native'
import ToggleSwitch from 'toggle-switch-react-native'

import Text, { Props as TextProps } from '@common/components/Text'
import spacings from '@common/styles/spacings'

import { ToggleProps } from './types'

interface Props extends Omit<ToggleProps, 'toggleStyle' | 'trackStyle'> {
  labelProps?: TextProps
  toggleStyle?: ViewStyle
  trackStyle?: ViewStyle
  children?: ReactNode
}

const Toggle = ({ isOn, onToggle, label, style, disabled }: Props) => {
  return (
    <View style={style}>
      {!!label && <Text style={spacings.mrTy}>{label}</Text>}
      <ToggleSwitch
        isOn={isOn}
        disabled={disabled}
        onToggle={onToggle}
        // thumbOnStyle={styles.thumbOnStyle}
        // thumbOffStyle={styles.thumbOffStyle}
        // trackOnStyle={styles.trackOnStyle}
        // trackOffStyle={styles.trackOffStyle}
        hitSlop={{ top: 15, bottom: 15, left: 5, right: 5 }}
      />
    </View>
  )
}

export default React.memo(Toggle)

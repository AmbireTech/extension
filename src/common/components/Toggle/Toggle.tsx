import React from 'react'
import { View } from 'react-native'
import ToggleSwitch from 'toggle-switch-react-native'

import Text from '@common/components/Text'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'

import styles from './styles'
import { ToggleProps } from './types'

const Toggle = ({ isOn, onToggle, label }: ToggleProps) => {
  return (
    <View style={styles.container}>
      {!!label && (
        <Text style={spacings.mrTy} color={isOn ? colors.heliotrope : colors.chetwode}>
          {label}
        </Text>
      )}
      <ToggleSwitch
        isOn={isOn}
        onToggle={onToggle}
        thumbOnStyle={styles.thumbOnStyle}
        thumbOffStyle={styles.thumbOffStyle}
        trackOnStyle={styles.trackOnStyle}
        trackOffStyle={styles.trackOffStyle}
        hitSlop={{ top: 15, bottom: 15, left: 5, right: 5 }}
      />
    </View>
  )
}

export default Toggle

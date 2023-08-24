import React from 'react'
import { ViewStyle } from 'react-native'

import Text from '@common/components/Text'
import FeeWrapper from '@web/modules/sign/components/FeeWrapper'
import styles from './styles'

interface Props {
  label: string
  amount: number
  onPress: () => void
  style?: ViewStyle
}

const Fee = ({ label, amount, onPress, style }: Props) => (
  <FeeWrapper onPress={onPress} style={style}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.amount} numberOfLines={1}>
      {amount}
    </Text>
  </FeeWrapper>
)

export default Fee

import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'

interface Styles {
  balanceWithMax: ViewStyle
  maxButton: ViewStyle
  maxButtonDisabled: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Styles>({
    balanceWithMax: {
      // The balance and the Max button keep their size, so only the converted amount next to them
      // gives way when it is too long for the row
      flexShrink: 0
    },
    maxButton: {
      ...spacings.mlTy,
      ...spacings.mrMi,
      ...spacings.phSm,
      paddingVertical: 2,
      borderRadius: 11
    },
    maxButtonDisabled: {
      opacity: 0.5
    }
  })

export default getStyles

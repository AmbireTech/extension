import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'

interface Style {
  maxButton: ViewStyle
  maxButtonDisabled: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    maxButton: {
      ...spacings.phSm,
      paddingVertical: 2,
      borderRadius: 11
    },
    maxButtonDisabled: {
      opacity: 0.5
    }
  })

export default getStyles

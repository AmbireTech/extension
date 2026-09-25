import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'

interface Style {
  maxButton: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    // Only the spacing off the balance beside it - MaxButton brings the pill itself
    maxButton: { ...spacings.mlTy }
  })

export default getStyles

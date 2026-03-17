import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'

interface Style {
  container: ViewStyle
  searchBar: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    container: {
      ...spacings.pt
    },
    searchBar: {
      ...spacings.pvSm,
      width: '100%'
    }
  })

export default getStyles

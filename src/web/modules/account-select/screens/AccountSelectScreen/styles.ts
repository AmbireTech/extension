import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'

interface Style {
  container: ViewStyle
  containerBelowTabs: ViewStyle
  searchBar: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    container: {
      ...spacings.pt
    },
    // The tabs keep their distance to the list with a margin of their own
    containerBelowTabs: {
      ...spacings.pt0
    },
    searchBar: {
      ...spacings.pvSm,
      width: '100%'
    }
  })

export default getStyles

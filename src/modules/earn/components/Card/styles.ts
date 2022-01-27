import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@modules/common/styles/spacings'

interface Style {
  selectWrapper: ViewStyle
  detailsPlaceholderContainer: ViewStyle
  detailsPlaceholder: ViewStyle
}

const styles = StyleSheet.create<Style>({
  selectWrapper: {
    zIndex: 100
  },
  detailsPlaceholderContainer: {
    ...spacings.mbLg,
    opacity: 0.5
  },
  detailsPlaceholder: {
    flex: 1,
    height: 18,
    backgroundColor: '#FFF',
    opacity: 0.1,
    ...spacings.mbMi
  }
})

export default styles

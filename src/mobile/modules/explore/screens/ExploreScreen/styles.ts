import { StyleSheet, ViewStyle } from 'react-native'

import flexbox from '@common/styles/utils/flexbox'

interface Style {
  filterButton: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    filterButton: {
      borderRadius: 50,
      height: 32,
      width: 32,
      ...flexbox.center
    }
  })

export default getStyles

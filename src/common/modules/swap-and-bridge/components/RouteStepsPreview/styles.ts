import { StyleSheet, ViewStyle } from 'react-native'

import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  iconsRow: ViewStyle
  amountsRow: ViewStyle
}

const styles = StyleSheet.create<Style>({
  container: {
    marginHorizontal: -5
  },
  iconsRow: {
    ...flexbox.directionRow,
    ...flexbox.alignCenter
  },
  amountsRow: {
    ...flexbox.directionRow,
    ...flexbox.justifySpaceBetween
  }
})

export default styles

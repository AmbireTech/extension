import { StyleSheet, ViewStyle } from 'react-native'

import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  addTokenContainer: ViewStyle
}

const styles = StyleSheet.create<Style>({
  container: {
    ...flexbox.directionRow,
    ...flexbox.justifySpaceBetween,
    ...spacings.pvMi,
    ...spacings.phMi,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: colors.zircon
  },
  addTokenContainer: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.violet,
    backgroundColor: colors.melrose_15,
    ...flexbox.justifyCenter,
    ...spacings.pvTy,
    ...spacings.mt
  }
})

export default styles

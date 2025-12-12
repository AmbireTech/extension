import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    container: {
      display: 'flex',
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween,
      ...spacings.pvTy,
      ...spacings.phTy
      // ...common.borderRadiusPrimary
    }
  })

export default getStyles

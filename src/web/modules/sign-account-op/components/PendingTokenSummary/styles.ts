import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    container: {
      ...flexbox.alignCenter,
      ...flexbox.directionRow,
      ...spacings.mbTy
    }
  })

export default getStyles

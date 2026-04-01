import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  actionsContainer: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    actionsContainer: {
      ...flexbox.flex1,
      ...spacings.phSm,
      ...spacings.pvSm,
      ...flexbox.directionRow,
      ...flexbox.wrap
    }
  })

export default getStyles

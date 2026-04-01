import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  actionsContainer: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    actionsContainer: {
      ...spacings.phSm,
      ...spacings.pvSm,
      ...flexbox.directionRow,
      columnGap: 8,
      flexWrap: 'nowrap'
    }
  })

export default getStyles

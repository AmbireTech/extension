import { StyleSheet, ViewStyle } from 'react-native'

import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    container: {
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween,
      ...flexbox.alignCenter,
      ...flexbox.flex1
    }
  })

export default getStyles

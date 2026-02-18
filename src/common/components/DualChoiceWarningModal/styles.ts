import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  container: ViewStyle
  content: ViewStyle
  titleAndIcon: ViewStyle
  buttons: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Styles>({
    container: {},
    content: {
      ...spacings.mbXl,
      ...spacings.ptLg
    },
    titleAndIcon: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.mb
    },
    buttons: {
      ...flexbox.directionRow,
      ...spacings.phSm,
      ...spacings.pvSm
    }
  })

export default getStyles

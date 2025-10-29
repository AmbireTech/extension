import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  modalHeader: ViewStyle
  sideContainer: ViewStyle
  backButton: ViewStyle
  closeIcon: ViewStyle
  rightSideContainer: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    modalHeader: {
      position: 'relative',
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween,
      ...flexbox.alignCenter,
      ...spacings.mbLg,
      width: '100%'
    },
    sideContainer: {
      width: 120,
      minWidth: 120,
      ...flexbox.justifyCenter
    },
    rightSideContainer: {
      minWidth: 120,
      ...flexbox.directionRow,
      ...flexbox.alignCenter
    },
    backButton: {
      ...flexbox.alignSelfStart
    },
    closeIcon: {
      ...flexbox.alignSelfEnd
    }
  })

export default getStyles

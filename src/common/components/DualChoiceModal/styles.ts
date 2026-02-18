import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps, ThemeType } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  modalHeader: ViewStyle
  modalInnerContainer: ViewStyle
  modalButtonsContainer: ViewStyle
  button: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Styles>({
    modalHeader: {
      ...spacings.phLg,
      ...spacings.ptLg,
      ...spacings.pb,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      ...flexbox.directionRow
    },
    modalInnerContainer: {
      backgroundColor: theme.primaryBackground,
      ...flexbox.flex1,
      ...spacings.pvLg,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...spacings.phLg
    },
    modalButtonsContainer: {
      ...spacings.pbXl,
      ...spacings.ptLg,
      ...flexbox.directionRow,
      ...flexbox.justifyEnd,
      ...spacings.phLg
    },
    button: {
      minWidth: 128
    }
  })

export default getStyles

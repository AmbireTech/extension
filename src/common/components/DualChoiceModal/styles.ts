import { StyleSheet, ViewStyle } from 'react-native'

import spacings, { SPACING_TY } from '@common/styles/spacings'
import { ThemeProps, ThemeType } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  modalHeader: ViewStyle
  modalInnerContainer: ViewStyle
  modalButtonsContainer: ViewStyle
  modalButtonsContainerCompact: ViewStyle
  button: ViewStyle
  buttonCompact: ViewStyle
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
    // One full-width row on narrow widths (mobile, narrow side panel) instead of the fixed-minWidth
    // row, which overflows there. The buttons grow from the width of their labels (see `buttonCompact`)
    modalButtonsContainerCompact: {
      justifyContent: 'flex-start',
      gap: SPACING_TY
    },
    button: {
      minWidth: 128
    },
    // Grows from the label width, so a long primary label still fits next to Cancel
    buttonCompact: {
      flexGrow: 1,
      minWidth: 0,
      ...spacings.phSm
    }
  })

export default getStyles

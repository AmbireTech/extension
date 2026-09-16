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
    // Stacks the buttons full-width instead of a fixed-minWidth row, which overflows on
    // narrow widths (mobile, narrow side panel). column-reverse (instead of reordering the
    // children) keeps the primary button on top without touching the JSX/prop order.
    modalButtonsContainerCompact: {
      flexDirection: 'column-reverse',
      alignItems: 'stretch',
      justifyContent: 'flex-start',
      gap: SPACING_TY
    },
    button: {
      minWidth: 128
    },
    buttonCompact: {
      width: '100%',
      minWidth: 0
    }
  })

export default getStyles

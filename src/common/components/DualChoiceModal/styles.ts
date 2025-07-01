import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
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
      ...spacings.pvXl,
      ...spacings.phXl,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      ...flexbox.directionRow
    },
    modalInnerContainer: {
      backgroundColor:
        themeType === THEME_TYPES.DARK ? theme.tertiaryBackground : theme.primaryBackground,
      ...spacings.pv2Xl,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...spacings.phXl
    },
    modalButtonsContainer: {
      ...spacings.pvXl,
      ...flexbox.directionRow,
      ...flexbox.justifyEnd,
      ...spacings.phXl
    },
    button: {
      minWidth: 128
    }
  })

export default getStyles

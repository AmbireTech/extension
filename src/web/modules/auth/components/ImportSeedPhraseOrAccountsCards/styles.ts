import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  modalHeader: ViewStyle
  modalInnerContainer: ViewStyle
  modalButtonsContainer: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    modalHeader: {
      ...spacings.pvXl,
      ...spacings.phXl,
      ...flexbox.justifyCenter
    },
    modalInnerContainer: {
      backgroundColor: theme.primaryBackground,
      ...spacings.pv2Xl,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...spacings.phXl
    },
    modalButtonsContainer: {
      ...spacings.pvXl,
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween,
      ...spacings.phXl
    }
  })

export default getStyles

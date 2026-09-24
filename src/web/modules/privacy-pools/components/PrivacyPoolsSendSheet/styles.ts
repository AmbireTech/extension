import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  phaseRow: ViewStyle
  phaseIcon: ViewStyle
  phaseDot: ViewStyle
  spinner: TextStyle
}

const PHASE_ICON_SIZE = 20
const PHASE_DOT_SIZE = 6

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    phaseRow: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.pvTy
    },
    // Fixed width so the labels line up whether the row shows a spinner, a check or a dot
    phaseIcon: {
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...spacings.mrTy,
      width: PHASE_ICON_SIZE,
      height: PHASE_ICON_SIZE
    },
    phaseDot: {
      width: PHASE_DOT_SIZE,
      height: PHASE_DOT_SIZE,
      borderRadius: PHASE_DOT_SIZE / 2,
      backgroundColor: theme.secondaryBorder
    },
    spinner: {
      width: 16,
      height: 16
    }
  })

export default getStyles

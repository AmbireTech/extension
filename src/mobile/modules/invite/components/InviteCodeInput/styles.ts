import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings, { SPACING_MI } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  header: ViewStyle
  cells: ViewStyle
  cell: ViewStyle
  separator: ViewStyle
  hiddenInput: TextStyle
}

const CELL_HEIGHT = 44
const CELL_BORDER_RADIUS = 6
const SEPARATOR_WIDTH = 8

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      width: '100%'
    },
    header: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      ...spacings.mbTy
    },
    cells: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      width: '100%'
    },
    cell: {
      ...flexbox.flex1,
      ...flexbox.center,
      height: CELL_HEIGHT,
      marginHorizontal: SPACING_MI / 2,
      borderWidth: 1,
      borderRadius: CELL_BORDER_RADIUS,
      backgroundColor: theme.secondaryBackground
    },
    separator: {
      width: SEPARATOR_WIDTH,
      height: 1,
      marginHorizontal: SPACING_MI,
      backgroundColor: theme.secondaryBorder
    },
    // The real input sits invisible on top of the cells, so the OS keyboard,
    // selection and paste all keep working while the cells do the rendering.
    hiddenInput: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0
    }
  })

export default getStyles

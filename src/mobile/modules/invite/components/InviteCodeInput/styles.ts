import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings, { SPACING_MI, SPACING_TY } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  cells: ViewStyle
  cell: ViewStyle
  separator: ViewStyle
  hiddenInput: TextStyle
}

const CELL_HEIGHT = 36
const SEPARATOR_WIDTH = 10

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      width: '100%'
    },
    cells: {
      ...flexbox.directionRow,
      ...flexbox.alignEnd,
      width: '100%'
    },
    cell: {
      ...flexbox.flex1,
      ...flexbox.alignCenter,
      ...flexbox.justifyEnd,
      height: CELL_HEIGHT,
      marginHorizontal: SPACING_MI / 2,
      borderBottomWidth: 1,
      ...spacings.pbMi
    },
    separator: {
      width: SEPARATOR_WIDTH,
      height: 1,
      marginHorizontal: SPACING_MI,
      marginBottom: SPACING_TY,
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

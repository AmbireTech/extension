import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings, { SPACING_SM } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  sheetHeader: ViewStyle
  sheetTitle: TextStyle
  sheetSubtitle: TextStyle
  closeButton: ViewStyle
  options: ViewStyle
  option: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    sheetHeader: {
      ...flexbox.directionRow,
      ...flexbox.alignStart,
      ...spacings.mbLg
    },
    sheetTitle: {
      ...spacings.mbMi,
      textAlign: 'center'
    },
    sheetSubtitle: {
      textAlign: 'center'
    },
    closeButton: {
      ...flexbox.center,
      width: 32,
      height: 32,
      flexShrink: 0,
      // Pulled out of the flow so the title stays centred on the sheet, not on what is left
      // of it next to the close button
      position: 'absolute',
      right: 0,
      top: 0
    },
    options: {
      gap: SPACING_SM
    },
    option: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...common.borderRadiusPrimary,
      ...spacings.ph,
      minHeight: 50,
      backgroundColor: theme.primaryBackground
    }
  })

export default getStyles

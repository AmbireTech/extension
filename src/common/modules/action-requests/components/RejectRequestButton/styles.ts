import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings, { SPACING_SM } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  sheetSubtitle: TextStyle
  options: ViewStyle
  option: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    sheetSubtitle: {
      textAlign: 'center'
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

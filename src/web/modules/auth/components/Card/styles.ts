import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

interface Styles {
  container: ViewStyle
  secondaryContainer: ViewStyle
  text: TextStyle
  iconWrapper: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Styles>({
    container: {
      width: 290,
      minHeight: 368,
      backgroundColor:
        themeType === THEME_TYPES.DARK ? theme.tertiaryBackground : theme.secondaryBackground,
      ...flexbox.alignCenter,
      ...common.borderRadiusPrimary,
      ...spacings.ph,
      ...spacings.pb,
      ...spacings.ptLg
    },
    secondaryContainer: {
      backgroundColor: theme.primaryBackground
    },
    text: text.center,
    iconWrapper: {
      height: 96,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter
    }
  })

export default getStyles

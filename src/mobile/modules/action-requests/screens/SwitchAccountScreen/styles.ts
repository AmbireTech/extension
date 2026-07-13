import { StyleSheet, ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  container: ViewStyle
  contentHeader: ViewStyle
  contentBody: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    container: {
      marginTop: -21,
      ...flexbox.flex1
    },
    contentHeader: {
      ...flexbox.alignCenter,
      ...flexbox.flex1,
      backgroundColor: theme.tertiaryBackground
    },
    contentBody: {
      backgroundColor: theme.primaryBackground
    }
  })

export default getStyles

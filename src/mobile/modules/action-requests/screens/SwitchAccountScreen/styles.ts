import { StyleSheet, ViewStyle } from 'react-native'

import { SPACING_SM } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common, { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  container: ViewStyle
  content: ViewStyle
  contentHeader: ViewStyle
  contentBody: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    container: {
      ...flexbox.alignCenter,
      marginHorizontal: 'auto'
    },
    content: {
      ...common.fullWidth,
      borderRadius: BORDER_RADIUS_PRIMARY,
      overflow: 'hidden',
      shadowColor: '#6770B3',
      shadowOffset: { width: 0, height: SPACING_SM },
      shadowOpacity: 0.3,
      shadowRadius: SPACING_SM,
      elevation: SPACING_SM
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

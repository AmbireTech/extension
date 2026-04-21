import { StyleSheet, ViewStyle } from 'react-native'

import spacings, { SPACING_SM } from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common, { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  container: ViewStyle
  content: ViewStyle
  contentHeader: ViewStyle
  contentBody: ViewStyle
  securityChecksContainer: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Styles>({
    container: {
      ...flexbox.flex1
    },
    content: {
      borderRadius: BORDER_RADIUS_PRIMARY,
      overflow: 'hidden'
    },
    contentHeader: {
      // ...flexbox.flex1,
      // ...flexbox.alignCenter
    },
    contentBody: {
      backgroundColor: theme.secondaryBackground
    },
    securityChecksContainer: {
      backgroundColor: theme.primaryBackground,
      ...common.borderRadiusPrimary,
      ...spacings.phSm,
      ...spacings.pvTy
    }
  })

export default getStyles

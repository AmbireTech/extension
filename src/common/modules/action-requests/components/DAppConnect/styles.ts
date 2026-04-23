import { StyleSheet, ViewStyle } from 'react-native'

import { isMobile } from '@common/config/env'
import spacings from '@common/styles/spacings'
import { ThemeProps, ThemeType } from '@common/styles/themeConfig'
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
    container: isMobile
      ? {
          ...flexbox.flex1
        }
      : {
          ...flexbox.alignCenter,
          marginHorizontal: 'auto',
          ...flexbox.flex1,
          maxWidth: 422
        },
    content: isMobile
      ? {
          marginTop: -21,
          ...common.fullWidth,
          overflow: 'hidden',
          ...flexbox.flex1
        }
      : {
          ...common.fullWidth,
          borderRadius: BORDER_RADIUS_PRIMARY,
          overflow: 'hidden'
        },
    contentHeader: isMobile
      ? {}
      : {
          ...flexbox.flex1,
          ...flexbox.alignCenter
        },
    contentBody: {
      backgroundColor: theme.secondaryBackground,
      ...(isMobile && flexbox.flex1)
    },
    securityChecksContainer: {
      backgroundColor: theme.primaryBackground,
      ...common.borderRadiusPrimary,
      ...spacings.phSm,
      ...spacings.pvTy
    }
  })

export default getStyles

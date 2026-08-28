import { StyleSheet, ViewStyle } from 'react-native'

import { isMobile } from '@common/config/env'
import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common, { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  container: ViewStyle
  content: ViewStyle
  contentHeader: ViewStyle
  contentBody: ViewStyle
  securityChecksContainer: ViewStyle
  trustButton: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    container: isMobile
      ? {
          ...flexbox.flex1
        }
      : {
          ...flexbox.alignCenter,
          marginHorizontal: 'auto',
          ...flexbox.flex1,
          maxWidth: 480,
          width: '100%'
        },
    content: isMobile
      ? {
          // Fixes the handle of the bottom sheet having a white background
          marginTop: -21,
          ...common.fullWidth,
          overflow: 'hidden',
          ...flexbox.flex1,
          ...spacings.mbLg
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
    },
    // Cancels the fixed height that Button's `size` applies, so the button is only as tall as its
    // own label, and keeps it from stretching to the row when the heading wraps to two lines.
    trustButton: {
      alignSelf: 'flex-start',
      height: 'auto',
      minHeight: 'auto'
    }
  })

export default getStyles

import { StyleSheet, ViewStyle } from 'react-native'

import spacings, { SPACING_MD } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common, { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  noKeysToSignAlert: ViewStyle
  kindOfMessage: ViewStyle
  warningContainer: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      ...flexbox.flex1
    },
    noKeysToSignAlert: {
      ...common.shadowSecondary,
      position: 'absolute',
      bottom: SPACING_MD,
      zIndex: 10,
      borderRadius: BORDER_RADIUS_PRIMARY
    },
    kindOfMessage: {
      backgroundColor: theme.infoBackground,
      borderColor: theme.infoDecorative,
      borderWidth: 1,
      borderRadius: 24,
      width: 'auto',
      height: 24,
      ...flexbox.justifyCenter,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.ph
    },
    warningContainer: {
      borderWidth: 1,
      backgroundColor: theme.warningBackground,
      borderColor: theme.warningDecorative
    }
  })

export default getStyles

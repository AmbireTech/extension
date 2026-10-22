import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  modal: ViewStyle
  closeButton: ViewStyle
  closeIconWrapper: ViewStyle
  updateButton: ViewStyle
}

const CLOSE_BUTTON_SIZE = 32
const CLOSE_ICON_WRAPPER_SIZE = 24

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    modal: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: theme.primaryAccent100,
      borderColor: theme.primaryAccent300,
      borderRadius: BORDER_RADIUS_PRIMARY,
      ...spacings.ph,
      ...spacings.ptXl,
      ...spacings.pb2Xl
    },
    closeButton: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: CLOSE_BUTTON_SIZE,
      height: CLOSE_BUTTON_SIZE,
      zIndex: 1,
      ...flexbox.center
    },
    closeIconWrapper: {
      width: CLOSE_ICON_WRAPPER_SIZE,
      height: CLOSE_ICON_WRAPPER_SIZE,
      borderRadius: CLOSE_ICON_WRAPPER_SIZE / 2,
      backgroundColor: theme.primaryBackground,
      ...flexbox.center
    },
    updateButton: {
      width: 192,
      alignSelf: 'center'
    }
  })

export default getStyles

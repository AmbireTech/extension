import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common, { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  settingModal: ViewStyle
  radioContainer: ViewStyle
  radio: ViewStyle
  radioHovered: ViewStyle
  radioSelected: ViewStyle
  radioSelectedInner: ViewStyle
}

export const SETTINGS_MODAL_WIDTH = 280

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    settingModal: {
      position: 'absolute',
      backgroundColor: theme.primaryBackground,
      top: 24,
      right: 10,
      borderRadius: BORDER_RADIUS_PRIMARY * 2,
      borderWidth: 1,
      borderColor: theme.secondaryBorder,
      ...spacings.ph,
      ...spacings.pv,
      width: SETTINGS_MODAL_WIDTH,
      ...common.shadowPrimary
    },
    radioContainer: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.ph
    },
    radio: {
      width: 16,
      height: 16,
      borderRadius: 50,
      borderWidth: 2,
      borderColor: theme.primaryBorder,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...spacings.mrTy
    },
    radioHovered: {
      borderColor: theme.successText
    },
    radioSelected: {
      borderColor: theme.successText
    },
    radioSelectedInner: {
      backgroundColor: theme.successText,
      width: 10,
      height: 10,
      borderRadius: 50
    }
  })

export default getStyles

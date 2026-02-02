import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import { SETTINGS_HEADER_HEIGHT } from '../../contexts/SettingsRoutesContext/styles'

interface Style {
  backToDashboardButton: ViewStyle
  settingsTitleWrapper: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    backToDashboardButton: {
      ...common.fullWidth,
      height: SETTINGS_HEADER_HEIGHT,
      borderBottomWidth: 1,
      borderBottomColor: theme.secondaryBorder,
      ...spacings.pv,
      ...spacings.ph,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.mbLg
    },
    settingsTitleWrapper: {
      ...common.fullWidth,
      height: SETTINGS_HEADER_HEIGHT,
      justifyContent: 'center'
    }
  })

export default getStyles

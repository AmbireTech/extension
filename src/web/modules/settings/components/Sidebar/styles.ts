import { StyleSheet, ViewStyle } from 'react-native'

import common from '@common/styles/utils/common'

import { SETTINGS_HEADER_HEIGHT } from '../../contexts/SettingsRoutesContext/styles'

interface Style {
  settingsTitleWrapper: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    settingsTitleWrapper: {
      ...common.fullWidth,
      height: SETTINGS_HEADER_HEIGHT,
      justifyContent: 'center'
    }
  })

export default getStyles

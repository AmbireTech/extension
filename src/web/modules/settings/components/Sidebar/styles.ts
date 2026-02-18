import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import { SETTINGS_HEADER_HEIGHT } from '../../contexts/SettingsRoutesContext/styles'

interface Style {
  settingsTitleWrapper: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    settingsTitleWrapper: {
      ...common.fullWidth,
      ...spacings.plSm,
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween,
      ...flexbox.alignCenter,
      height: SETTINGS_HEADER_HEIGHT
    }
  })

export default getStyles

import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  tabs: ViewStyle
  tab: ViewStyle
  activeTab: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    tabs: {
      ...flexbox.directionRow,
      ...flexbox.justifyCenter,
      ...spacings.mb
    },
    tab: {
      ...spacings.phSm,
      ...spacings.pbMi,
      borderBottomWidth: 2,
      borderBottomColor: theme.primaryBorder
    },
    activeTab: {
      borderBottomColor: theme.primaryText
    }
  })

export default getStyles

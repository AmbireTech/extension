import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

type Styles = {
  container: ViewStyle
  expandedContainer: ViewStyle
  header: ViewStyle
  expandedHeader: ViewStyle
  providerData: ViewStyle
  positionData: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Styles>({
    container: {
      ...common.borderRadiusPrimary,
      ...spacings.mbTy,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'transparent'
    },
    expandedContainer: {
      borderColor: themeType === THEME_TYPES.DARK ? theme.linkText : theme.primary
    },
    header: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      ...spacings.pvSm,
      ...spacings.phSm,
      ...common.borderRadiusPrimary
    },
    expandedHeader: {
      backgroundColor: theme.quaternaryBackground,
      borderBottomRightRadius: 0,
      borderBottomLeftRadius: 0
    },
    providerData: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter
    },
    positionData: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter
    }
  })

export default getStyles

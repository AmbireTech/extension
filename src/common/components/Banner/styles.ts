import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings, { SPACING_XL } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import commonStyles from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@web/utils/uiType'

interface Style {
  container: ViewStyle
  content: ViewStyle
  contentInner: ViewStyle
  icon: ViewStyle
  title: TextStyle
  actions: ViewStyle
  action: ViewStyle
}

const isTab = getUiType().isTab

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween,
      ...flexbox.alignCenter,
      ...spacings.pr,
      ...spacings.mbSm,
      backgroundColor: theme.secondaryBackground,
      ...commonStyles.borderRadiusPrimary,
      overflow: 'hidden',
      ...commonStyles.shadowSecondary,
      shadowColor: theme.secondaryBackground,
      shadowOffset: {
        width: 5,
        height: 7
      }
    },
    content: {
      ...flexbox.directionRow,
      ...flexbox.flex1,
      ...flexbox.alignCenter,
      ...spacings.plTy, // Required by design and missing in spacings.
      borderLeftColor: theme.primary,
      borderLeftWidth: 7,
      ...spacings.pvTy
    },
    contentInner: {
      ...spacings.mlSm,
      ...flexbox.wrap,
      ...flexbox.flex1
    },
    icon: {
      ...flexbox.center,
      width: SPACING_XL,
      height: SPACING_XL,
      ...commonStyles.borderRadiusPrimary,
      backgroundColor: theme.primary
    },
    title: { lineHeight: isTab ? 25 : 20 },
    actions: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter
    },
    action: {
      ...spacings.mlSm,
      ...spacings.mb0,
      width: 80
    }
  })

export default getStyles

import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  icon: ViewStyle
  header: ViewStyle
  content: ViewStyle
  nonExpandableContent: ViewStyle
  rawMessage: ViewStyle
  rawMessageTitle: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      backgroundColor: theme.secondaryBackground,
      borderWidth: 1,
      ...common.borderRadiusPrimary,
      borderColor: theme.secondaryBorder,
      minHeight: 52,
      ...spacings.ph
    },
    icon: { ...spacings.pl, ...spacings.ptTy },
    content: { ...flexbox.flex1 },
    nonExpandableContent: {
      ...spacings.pl
    },
    header: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...flexbox.justifySpaceBetween,
      ...spacings.ptSm,
      ...spacings.pb
    },
    rawMessage: {
      ...spacings.pbSm
    },
    rawMessageTitle: {
      ...spacings.mb
    }
  })

export default getStyles

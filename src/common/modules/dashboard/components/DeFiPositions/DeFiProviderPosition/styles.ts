import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

type Styles = {
  container: ViewStyle
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
    header: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      ...spacings.pvSm,
      ...spacings.phSm,
      ...common.borderRadiusPrimary
    },
    expandedHeader: {
      backgroundColor: theme.secondaryBackground
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

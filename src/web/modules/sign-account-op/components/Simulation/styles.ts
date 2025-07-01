import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  simulationSection: ViewStyle
  simulationScrollView: ViewStyle
  simulationContainer: ViewStyle
  simulationContainerHeader: ViewStyle
  spinner: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    simulationSection: {
      ...spacings.pbLg
    },
    simulationScrollView: {
      ...spacings.phSm,
      ...spacings.pvSm
    },
    simulationContainer: {
      borderWidth: 1,
      ...common.borderRadiusPrimary,
      borderColor: themeType === THEME_TYPES.DARK ? theme.primaryBorder : theme.secondaryBorder,
      overflow: 'hidden',
      ...flexbox.flex1,
      maxHeight: '100%'
    },
    simulationContainerHeader: {
      backgroundColor: theme.secondaryBackground,
      ...spacings.phTy,
      ...spacings.pvMi
    },
    spinner: {
      alignSelf: 'center'
    }
  })

export default getStyles

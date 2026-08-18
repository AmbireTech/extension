import { StyleSheet, ViewStyle } from 'react-native'

import { isMobile, isWeb } from '@common/config/env'
import spacings from '@common/styles/spacings'
import { ThemeProps, ThemeType } from '@common/styles/themeConfig'
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
      ...(isMobile ? spacings.pbSm : spacings.pbMd)
    },
    simulationScrollView: {
      ...spacings.phSm,
      ...spacings.pvSm
    },
    simulationContainer: {
      borderWidth: 1,
      ...common.borderRadiusPrimary,
      borderColor: theme.primaryBorder,
      overflow: 'hidden',
      ...flexbox.flex1,
      // On mobile the assets are not scrollable, so a max height would clip them
      ...(isWeb ? { maxHeight: '100%' as const } : {})
    },
    simulationContainerHeader: {
      backgroundColor: theme.secondaryBackground,
      ...spacings.phSm,
      ...spacings.pvTy,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween
    },
    spinner: {
      alignSelf: 'center'
    }
  })

export default getStyles

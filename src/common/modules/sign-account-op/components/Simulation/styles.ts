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
  simulationContainerWide: ViewStyle
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
      overflow: 'hidden'
    },
    // Side by side (wide layout), "Assets out"/"Assets in" are row siblings that should match
    // each other's height and internally scroll once there are too many rows to fit. Stacked
    // (compact layout), they're column siblings instead and must NOT split the available
    // height evenly - each should size to its own content, same as on mobile, and let the page
    // around them scroll instead of clipping/nested-scrolling internally. These two behaviors
    // are mutually exclusive, so they're kept as a separate style applied only in the wide
    // case, rather than one some other style tries to cancel back out for the compact case -
    // react-native-web's style merging treats an explicit `undefined` override as "no value
    // for this key", not "clear the previously set value", so that approach silently no-ops.
    simulationContainerWide: {
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

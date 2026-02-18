import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings, { SPACING, SPACING_MI, SPACING_TY } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common, { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  tokenInfoAndIcon: ViewStyle
  tokenInfo: ViewStyle
  tokenSymbolAndNetwork: ViewStyle
  balance: ViewStyle
  networkIcon: ViewStyle
  actionsContainer: ViewStyle
  action: ViewStyle
  hideTokenButton: TextStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    tokenInfoAndIcon: {
      ...flexbox.directionRow,
      ...spacings.mb,
      ...flexbox.flex1,
      ...flexbox.alignCenter
    },
    tokenInfo: {
      ...spacings.mh,
      ...flexbox.flex1
    },
    balance: {
      ...flexbox.flex1,
      ...flexbox.alignSelfStart,
      ...flexbox.wrap
    },
    networkIcon: {
      width: 20,
      height: 20,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 12
    },
    tokenSymbolAndNetwork: {
      ...flexbox.directionRow
    },
    actionsContainer: {
      ...flexbox.flex1,
      ...spacings.phSm,
      ...spacings.pvSm,
      ...flexbox.directionRow,
      ...flexbox.wrap
    },
    action: {
      width: '25%',
      maxWidth: '25%',
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...spacings.phMi,
      ...spacings.pvSm,
      ...common.borderRadiusPrimary
    },
    // @ts-ignore web style
    hideTokenButton: {
      color: theme.primary,
      padding: SPACING_MI,
      borderColor: theme.primary,
      borderRadius: BORDER_RADIUS_PRIMARY,
      borderWidth: 1,
      paddingHorizontal: SPACING,
      paddingVertical: SPACING_TY
    }
  })

export default getStyles

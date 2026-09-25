import { ImageStyle, StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  cardWrapper: ViewStyle
  card: ViewStyle
  cardGradient: ViewStyle
  cardContent: ViewStyle
  cardHeader: ViewStyle
  cardTitleWrapper: ViewStyle
  cardDescription: TextStyle
  walletStakingIconWrapper: ViewStyle
  walletStakingIcon: ImageStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    cardWrapper: {
      ...spacings.mbTy,
      flex: 1
    },
    card: {
      ...common.borderRadiusPrimary,
      borderWidth: 1,
      borderLeftColor: theme.secondaryAccent300,
      borderTopColor: theme.secondaryAccent300,
      borderRightColor: theme.primaryAccent200,
      borderBottomColor: theme.primaryAccent200,
      overflow: 'hidden'
    },
    cardGradient: {
      ...StyleSheet.absoluteFillObject
    },
    cardContent: {
      ...spacings.phSm,
      ...spacings.pvSm,
      backgroundColor: theme.secondaryBackground
    },
    cardHeader: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.mbSm
    },
    cardTitleWrapper: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      ...flexbox.flex1,
      minWidth: 0
    },
    cardDescription: {
      lineHeight: 18
    },
    walletStakingIconWrapper: {
      ...flexbox.center,
      width: 40,
      height: 40,
      backgroundColor: theme.primaryBackground,
      borderRadius: 8
    },
    walletStakingIcon: {
      width: 40,
      height: 40,
      borderRadius: 8
    }
  })

export default getStyles

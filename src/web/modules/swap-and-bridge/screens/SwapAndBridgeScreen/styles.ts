import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  tabLayoutContentContainer: ViewStyle
  container: ViewStyle
  secondaryContainer: ViewStyle
  secondaryContainerWarning: ViewStyle
  networkSelectorContainer: ViewStyle
  previewRouteContainer: ViewStyle
  selectAnotherRouteButton: ViewStyle
  routesRefreshButtonWrapper: ViewStyle
  followUpTxnText: TextStyle
}

export const SWAP_AND_BRIDGE_FORM_WIDTH = 600

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    tabLayoutContentContainer: {
      ...spacings.pt2Xl,
      ...flexbox.alignCenter
    },
    container: {
      width: '100%',
      maxWidth: SWAP_AND_BRIDGE_FORM_WIDTH,
      flex: 1,
      alignSelf: 'center',
      overflow: 'visible'
    },
    secondaryContainer: {
      backgroundColor: theme.secondaryBackground,
      ...common.borderRadiusPrimary,
      ...spacings.ptMd,
      ...spacings.prMd,
      ...spacings.pbSm,
      ...spacings.pl
    },
    secondaryContainerWarning: {
      borderWidth: 1,
      borderColor: theme.warningDecorative,
      backgroundColor: theme.warningBackground
    },
    networkSelectorContainer: {
      ...flexbox.directionRow,
      ...flexbox.justifyEnd,
      ...flexbox.alignCenter,
      borderBottomWidth: 1,
      borderBottomColor: theme.tertiaryBackground,
      ...spacings.mbTy,
      ...spacings.phSm,
      ...spacings.pbTy
    },
    previewRouteContainer: {
      backgroundColor: '#F5F6FA',
      ...common.borderRadiusPrimary,
      ...spacings.phSm,
      ...spacings.pvSm
    },
    selectAnotherRouteButton: {
      paddingVertical: 2,
      ...spacings.phTy,
      ...flexbox.directionRow,
      ...flexbox.alignCenter
    },
    followUpTxnText: {
      ...spacings.plTy,
      ...spacings.prMi,
      ...spacings.mrMi,
      ...spacings.pvMi,
      ...common.borderRadiusPrimary
    },
    routesRefreshButtonWrapper: {
      height: 20,
      ...flexbox.justifyCenter
    }
  })

export default getStyles

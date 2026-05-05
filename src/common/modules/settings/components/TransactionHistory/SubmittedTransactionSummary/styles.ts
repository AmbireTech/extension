import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import { isMobile } from '@common/config/env'
import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  header: ViewStyle
  headerMeta: ViewStyle
  sheetContainer: ViewStyle
  sheetHeader: ViewStyle
  sheetHeaderBackButton: ViewStyle
  sheetHeaderTitle: TextStyle
  sheetScroll: ViewStyle
  sheetScrollContent: ViewStyle
  modalSection: ViewStyle
  modalConfirmedRow: ViewStyle
  modalStepRow: ViewStyle
  modalStepRowRight: ViewStyle
  modalHashCopyButton: ViewStyle
  summaryItem: ViewStyle
  footer: ViewStyle
  footerButtonsRow: ViewStyle
  footerRightButtonsGroup: ViewStyle
  footerButton: ViewStyle
  contentContainer: ViewStyle
  dappInteractionsColumn: ViewStyle
  dappInteractionRow: ViewStyle
  balanceChangesRightColumn: ViewStyle
  balanceChangeRow: ViewStyle
  modalBalanceChangesSection: ViewStyle
  modalSimulationContainer: ViewStyle
  modalSimulationContainerHeader: ViewStyle
  modalSimulationBody: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      ...common.borderRadiusPrimary,
      backgroundColor: theme.secondaryBackground,
      borderColor: theme.secondaryBackground
    },
    header: {
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween,
      ...flexbox.alignCenter
    },
    headerMeta: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter
    },
    sheetContainer: {
      ...flexbox.flex1
    },
    sheetHeader: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      ...spacings.phSm,
      ...spacings.ptSm,
      ...spacings.pbTy
    },
    sheetHeaderBackButton: {
      width: 24,
      height: 24,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...spacings.mlMi
    },
    sheetHeaderTitle: {
      ...flexbox.flex1,
      textAlign: 'center',
      ...spacings.mtMd,
      ...spacings.mbLg
    },
    sheetScroll: {
      ...flexbox.flex1
    },
    sheetScrollContent: {
      ...spacings.pbSm
    },
    modalSection: {
      ...spacings.mbSm
    },
    modalConfirmedRow: {
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween,
      ...flexbox.alignCenter,
      ...flexbox.wrap
    },
    modalStepRow: {
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween,
      ...flexbox.alignCenter,
      width: '100%'
    },
    modalStepRowRight: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter
    },
    modalHashCopyButton: {
      width: 24,
      height: 24,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...spacings.mlTy
    },
    summaryItem: {
      backgroundColor: 'transparent',
      borderWidth: 0
    },
    contentContainer: {
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween,
      ...flexbox.alignStart,
      backgroundColor: 'transparent',
      ...spacings.phSm,
      ...spacings.pbSm
    },
    dappInteractionsColumn: {
      ...flexbox.flex1,
      ...flexbox.alignStart
    },
    dappInteractionRow: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter
    },
    balanceChangesRightColumn: {
      ...flexbox.alignEnd
    },
    balanceChangeRow: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter
    },
    modalBalanceChangesSection: {
      backgroundColor: 'transparent'
    },
    modalSimulationContainer: {
      borderWidth: 1,
      ...common.borderRadiusPrimary,
      borderColor: theme.primaryBorder,
      overflow: 'hidden',
      ...flexbox.flex1
    },
    modalSimulationContainerHeader: {
      backgroundColor: theme.secondaryBackground,
      ...spacings.phSm,
      ...spacings.pvTy
    },
    modalSimulationBody: {
      ...spacings.phSm,
      ...spacings.pvSm
    },
    footer: {
      borderTopColor: theme.primaryBorder,
      borderTopWidth: 1,
      backgroundColor: theme.primaryBackground,
      ...(isMobile ? spacings.phSm : spacings.phLg),
      ...spacings.pvMd
    },
    footerButtonsRow: {
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween,
      ...flexbox.alignCenter,
      ...(isMobile ? flexbox.wrap : {})
    },
    footerRightButtonsGroup: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...(isMobile ? { flexShrink: 1 } : {})
    },
    footerButton: {
      ...spacings.mb0,
      ...(isMobile ? spacings.plTy : spacings.pl),
      ...(isMobile ? spacings.prTy : spacings.prLg),
      ...(isMobile ? { flexShrink: 1 } : {})
    }
  })

export default getStyles

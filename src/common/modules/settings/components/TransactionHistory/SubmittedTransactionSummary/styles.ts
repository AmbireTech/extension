import { StyleSheet, ViewStyle } from 'react-native'

import { isMobile } from '@common/config/env'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  header: ViewStyle
  headerMeta: ViewStyle
  sheetHeader: ViewStyle
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
  footerButtonWrapper: ViewStyle
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
    sheetHeader: {
      ...spacings.phSm,
      ...spacings.ptSm
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
      ...(isMobile ? spacings.ptSm : spacings.pvMd)
    },
    footerButtonsRow: {
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween,
      ...flexbox.alignCenter,
      ...(isMobile ? { columnGap: SPACING_SM, ...spacings.mbSm } : {})
    },
    footerRightButtonsGroup: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter
    },
    // On mobile the two secondary buttons share the row equally, so they must be
    // able to grow and shrink together instead of being sized by their label
    footerButtonWrapper: {
      ...flexbox.flex1
    },
    footerButton: {
      ...spacings.mb0,
      ...(isMobile ? { ...spacings.phSm, height: 46 } : { ...spacings.pl, ...spacings.prLg })
    }
  })

export default getStyles

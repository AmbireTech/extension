import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'

interface Styles {
  closeButton: ViewStyle
  networkHeaderIcon: ViewStyle
  networkSection: ViewStyle
  timelineRail: ViewStyle
  timelineLineTop: ViewStyle
  timelineLineBottom: ViewStyle
  nonceMarker: ViewStyle
  nonceMarkerCurrent: ViewStyle
  nonceMarkerText: TextStyle
  nonceMarkerTextCurrent: TextStyle
  nextBadge: ViewStyle
  transactionCard: ViewStyle
  humanizationItem: ViewStyle
  sameNonceGroup: ViewStyle
  sameNonceBranch: ViewStyle
  divider: ViewStyle
  emptyState: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16
    },
    networkHeaderIcon: {
      width: 53,
      height: 36,
      borderRadius: 18,
      marginRight: 9
    },
    networkSection: {
      width: '100%'
    },
    timelineRail: {
      width: 53,
      marginRight: 7,
      alignItems: 'center'
    },
    timelineLineTop: {
      position: 'absolute',
      top: 0,
      height: 18,
      width: 2,
      backgroundColor: theme.primaryAccent
    },
    timelineLineBottom: {
      position: 'absolute',
      top: 18,
      bottom: 0,
      width: 2,
      backgroundColor: theme.primaryAccent
    },
    nonceMarker: {
      minHeight: 28,
      minWidth: 28,
      padding: 3,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.secondaryBorder,
      backgroundColor: theme.secondaryBackground,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2
    },
    nonceMarkerCurrent: {
      borderColor: theme.primaryAccent,
      backgroundColor: theme.primaryAccent
    },
    nonceMarkerText: {
      color: theme.primaryText
    },
    nonceMarkerTextCurrent: {
      color: theme.neutral100
    },
    nextBadge: {
      borderWidth: 1,
      borderColor: theme.primaryAccent,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 6,
      zIndex: 3
    },
    transactionCard: {
      borderWidth: 1,
      borderColor: theme.secondaryBorder,
      backgroundColor: theme.secondaryBackground,
      ...common.borderRadiusPrimary
    },
    humanizationItem: {
      minHeight: 28,
      borderRadius: 8,
      backgroundColor: theme.primaryBackground
    },
    sameNonceGroup: {
      position: 'relative',
      borderWidth: 1,
      borderColor: theme.secondaryBorder,
      borderLeftWidth: 2,
      borderLeftColor: theme.primaryAccent,
      backgroundColor: theme.secondaryBackground,
      ...common.borderRadiusPrimary
    },
    sameNonceBranch: {
      position: 'absolute',
      left: -16,
      top: 48,
      bottom: 40,
      width: 14,
      borderLeftWidth: 2,
      borderTopWidth: 2,
      borderBottomWidth: 2,
      borderColor: theme.primaryAccent
    },
    divider: {
      height: 1,
      backgroundColor: theme.secondaryBorder
    },
    emptyState: {
      minHeight: 240,
      alignItems: 'center',
      justifyContent: 'center'
    }
  })

export default getStyles

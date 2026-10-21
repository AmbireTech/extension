import type { ViewStyle } from 'react-native'
import { StyleSheet } from 'react-native'

import { SPACING, SPACING_LG, SPACING_SM, SPACING_XL } from '@common/styles/spacings'
import common, { hexToRgba } from '@common/styles/utils/common'

import type { ThemeProps } from '@common/styles/themeConfig'

interface Styles {
  pendingHeader: ViewStyle
  fetchButton: ViewStyle
  fetchButtonLoading: ViewStyle
  chainWrapper: ViewStyle
  chainHeader: ViewStyle
  animatedContentWrapper: ViewStyle
  measuredContent: ViewStyle
  bundle: ViewStyle
  bundleCard: ViewStyle
  bundleFooter: ViewStyle
  cancellationRow: ViewStyle
  divider: ViewStyle
  orDivider: ViewStyle
  orDividerLine: ViewStyle
  orDividerLabel: ViewStyle
  orDividerText: ViewStyle
  currentNoncePill: ViewStyle
  futureNoncePill: ViewStyle
  readyPill: ViewStyle
  canSignPill: ViewStyle
  nonceNavigationButton: ViewStyle
  nonceNavigationButtonDisabled: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    pendingHeader: {
      minHeight: 42,
      borderBottomWidth: 1,
      borderBottomColor: theme.secondaryBorder
    },
    fetchButton: {
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.primaryAccent100
    },
    fetchButtonLoading: {
      backgroundColor: theme.tertiaryBackground
    },
    // Hidden overflow, so that the header gets clipped by the rounded corners
    chainWrapper: {
      borderWidth: 1,
      borderColor: hexToRgba(theme.primaryAccent, 0.5),
      backgroundColor: theme.secondaryBackground,
      overflow: 'hidden',
      ...common.borderRadiusPrimary
    },
    chainHeader: {
      borderBottomWidth: 1,
      borderBottomColor: theme.secondaryBorder,
      backgroundColor: theme.hoverBackground
    },
    animatedContentWrapper: {
      overflow: 'hidden'
    },
    // Absolute, so that it keeps its natural height inside the animated (fixed height) wrapper
    measuredContent: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      paddingTop: SPACING_SM
    },
    // The OR dividers span the whole width of the chain box, so the bundles bring their own
    // horizontal padding
    bundle: {
      paddingHorizontal: SPACING_SM
    },
    bundleCard: {
      backgroundColor: theme.primaryBackground,
      // The more specific paddings, because the frame of the humanized calls sets them too
      paddingHorizontal: SPACING_SM,
      paddingVertical: SPACING_SM,
      ...common.borderRadiusPrimary
    },
    bundleFooter: {
      marginTop: SPACING
    },
    // Sits under an OR divider, below the bundles of the nonce
    cancellationRow: {
      paddingTop: SPACING_SM,
      paddingBottom: SPACING_LG,
      paddingHorizontal: SPACING_SM
    },
    divider: {
      height: 1,
      backgroundColor: theme.secondaryBorder
    },
    // The margins are measured to the line, so the label is laid over it instead of making
    // the row as tall as the text
    orDivider: {
      height: 2,
      marginVertical: SPACING_XL
    },
    orDividerLine: {
      height: 2,
      backgroundColor: theme.hoverBackground
    },
    orDividerLabel: {
      position: 'absolute',
      top: -11,
      left: 0,
      right: 0,
      height: 24
    },
    // Hides the part of the line behind the label
    orDividerText: {
      backgroundColor: theme.secondaryBackground
    },
    currentNoncePill: {
      height: 25,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: hexToRgba(theme.primaryAccent, 0.16),
      backgroundColor: theme.primaryAccent100
    },
    futureNoncePill: {
      height: 25,
      borderRadius: 8,
      backgroundColor: theme.warningBackground
    },
    readyPill: {
      height: 20,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: hexToRgba(theme.successDecorative, 0.5),
      backgroundColor: theme.successBackground
    },
    canSignPill: {
      height: 20,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: hexToRgba(theme.primaryAccent, 0.4),
      backgroundColor: theme.primaryAccent100
    },
    nonceNavigationButton: {
      width: 22,
      height: 22
    },
    nonceNavigationButtonDisabled: {
      opacity: 0.4
    }
  })

export default getStyles

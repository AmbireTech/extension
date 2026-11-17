import type { TextStyle, ViewStyle } from 'react-native'
import { StyleSheet } from 'react-native'

import { SPACING_MD, SPACING_SM } from '@common/styles/spacings'
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
  actionButtonText: TextStyle
  actionButton: ViewStyle
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
      borderColor: theme.primaryAccent,
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
      marginTop: SPACING_SM
    },
    // Sits under an OR divider, below the bundles of the nonce. The paddings are not on the
    // spacing scale. The bottom one is the 10 of the row plus the 12 bottom padding of the box.
    cancellationRow: {
      paddingTop: 10,
      paddingBottom: 22,
      paddingHorizontal: SPACING_SM
    },
    // The 12px button text, the same as the one of the Open button
    actionButtonText: {
      fontSize: 12
    },
    // Wider than the default small button, to match the design
    actionButton: {
      height: 40,
      paddingHorizontal: SPACING_MD
    },
    divider: {
      height: 1,
      backgroundColor: theme.secondaryBorder
    },
    // The margins are measured to the label, which is as tall as the row, and the line is
    // laid through the middle of it
    orDivider: {
      height: 21,
      marginVertical: SPACING_MD
    },
    orDividerLine: {
      position: 'absolute',
      top: 10,
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: theme.hoverBackground
    },
    orDividerLabel: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 21
    },
    // Hides the part of the line behind the label
    orDividerText: {
      backgroundColor: theme.secondaryBackground
    },
    currentNoncePill: {
      height: 24,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: hexToRgba(theme.primaryAccent, 0.16),
      backgroundColor: theme.primaryAccent100
    },
    futureNoncePill: {
      height: 24,
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
      width: 24,
      height: 24
    },
    nonceNavigationButtonDisabled: {
      opacity: 0.4
    }
  })

export default getStyles

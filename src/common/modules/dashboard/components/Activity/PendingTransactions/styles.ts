import type { ViewStyle } from 'react-native'
import { StyleSheet } from 'react-native'

import { SPACING_SM } from '@common/styles/spacings'
import common, { hexToRgba } from '@common/styles/utils/common'

import type { ThemeProps } from '@common/styles/themeConfig'
/** The height the OR divider floats over. The bundles on both sides of it reserve half of
 * it each, so that the divider needs no background of its own. */
export const OR_DIVIDER_HEIGHT = 28

interface Styles {
  pendingHeader: ViewStyle
  fetchButton: ViewStyle
  fetchButtonLoading: ViewStyle
  chainWrapper: ViewStyle
  chainHeader: ViewStyle
  animatedContentWrapper: ViewStyle
  measuredContent: ViewStyle
  bundle: ViewStyle
  bundleWithDividerAbove: ViewStyle
  bundleWithDividerBelow: ViewStyle
  humanizationItem: ViewStyle
  divider: ViewStyle
  orDividerAnchor: ViewStyle
  orDividerRow: ViewStyle
  orDividerLine: ViewStyle
  orDividerPill: ViewStyle
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
    // Hidden overflow, so that a bundle filling the box gets clipped by the rounded corners
    chainWrapper: {
      borderWidth: 2,
      // Not primaryBorder, because it is the same color as the box body and leaves the block
      // without a visible outline
      borderColor: theme.neutral600,
      // The same color as the bundles, the header and the OR divider, so that the padding
      // around them does not show up as a lighter strip
      backgroundColor: theme.secondaryBackground,
      overflow: 'hidden',
      ...common.borderRadiusPrimary
    },
    chainHeader: {
      borderBottomWidth: 1,
      borderBottomColor: theme.secondaryBorder,
      backgroundColor: theme.secondaryBackground
    },
    animatedContentWrapper: {
      overflow: 'hidden'
    },
    // Absolute, so that it keeps its natural height inside the animated (fixed height) wrapper
    measuredContent: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0
    },
    // The bundles span the whole width of the chain box, so they carry no frame of their own
    // - the OR divider separates them
    bundle: {
      backgroundColor: theme.secondaryBackground
    },
    // The halves of the divider the bundles reserve, added on top of their own padding
    bundleWithDividerAbove: {
      paddingTop: SPACING_SM + OR_DIVIDER_HEIGHT / 2
    },
    bundleWithDividerBelow: {
      paddingBottom: SPACING_SM + OR_DIVIDER_HEIGHT / 2
    },
    humanizationItem: {
      minHeight: 28,
      borderRadius: 8,
      backgroundColor: hexToRgba(theme.primaryBackground, 0.75)
    },
    divider: {
      height: 1,
      backgroundColor: theme.secondaryBorder
    },
    // The divider paints no background of its own. It is a zero height anchor at the seam of
    // two bundles, over which the lines and the OR pill float, so that the bundles fill the
    // space above and below it with their own color
    orDividerAnchor: {
      height: 0,
      zIndex: 1
    },
    orDividerRow: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: -OR_DIVIDER_HEIGHT / 2,
      height: OR_DIVIDER_HEIGHT
    },
    orDividerLine: {
      height: 2,
      backgroundColor: hexToRgba(theme.warningDecorative, 0.5)
    },
    orDividerPill: {
      height: 20,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: hexToRgba(theme.warningDecorative, 0.5),
      backgroundColor: theme.warningBackground
    },
    currentNoncePill: {
      height: 18,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: hexToRgba(theme.primaryAccent, 0.16),
      backgroundColor: theme.primaryAccent100
    },
    futureNoncePill: {
      height: 18,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: hexToRgba(theme.warningDecorative, 0.5),
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
      height: 22,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: theme.secondaryBorder,
      backgroundColor: theme.secondaryBackground
    },
    nonceNavigationButtonDisabled: {
      opacity: 0.4
    }
  })

export default getStyles

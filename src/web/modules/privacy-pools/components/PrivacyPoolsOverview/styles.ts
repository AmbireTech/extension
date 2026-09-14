import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import { isWeb } from '@common/config/env'
import spacings, { SPACING } from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  content: ViewStyle
  headerRow: ViewStyle
  refreshButton: ViewStyle
  hero: ViewStyle
  heroAmountRow: ViewStyle
  heroAmount: TextStyle
  heroDecimals: TextStyle
  unavailableContainer: ViewStyle
  unavailableText: TextStyle
}

/**
 * The card always sits on the dark OverviewBackground, so its contents use fixed light colors
 * rather than theme ones - the same way the dashboard overview does. Named here so there is one
 * place to change them instead of a hex per JSX node.
 */
export const OVERVIEW_COLORS = {
  primaryText: '#FFFFFF',
  secondaryText: '#F2F4F7',
  icon: '#E3E6EB'
}

// Keeps the hero row's height stable so toggling the skeleton doesn't shift the layout
export const HERO_AMOUNT_HEIGHT = 40

const getStyles = () =>
  StyleSheet.create<Style>({
    container: {
      ...common.borderRadiusPrimary,
      ...spacings.ptTy,
      ...spacings.phSm,
      paddingBottom: SPACING,
      overflow: 'hidden'
    },
    // Lifts the contents above the absolutely positioned background
    content: {
      zIndex: 2
    },
    headerRow: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      width: '100%'
    },
    refreshButton: {
      width: 28,
      height: 28,
      ...flexbox.center
    },
    hero: {
      ...flexbox.alignCenter,
      ...spacings.ptSm,
      ...spacings.mbSm
    },
    heroAmountRow: {
      height: HERO_AMOUNT_HEIGHT,
      ...flexbox.justifyCenter
    },
    // Line heights are per font size (not per container height), matching the dashboard's balance,
    // so the amount and its decimals sit on the same baseline.
    heroAmount: {
      lineHeight: isWeb ? 28 : 36
    },
    heroDecimals: {
      lineHeight: isWeb ? 20 : 28
    },
    unavailableContainer: {
      ...flexbox.alignCenter,
      ...spacings.ptSm
    },
    unavailableText: {
      textAlign: 'center'
    }
  })

export default getStyles

import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings, { SPACING, SPACING_SM } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  detailsCard: ViewStyle
  feePreviewRow: ViewStyle
  feePreviewLabel: ViewStyle
  feeDetailsButton: ViewStyle
  feePreviewValues: ViewStyle
  feePreviewOldFee: TextStyle
  cardDetails: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    detailsCard: {
      ...spacings.phSm,
      ...spacings.pvSm,
      ...spacings.mbLg,
      rowGap: SPACING_SM,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 16
    },
    feePreviewRow: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      ...spacings.phSm,
      ...spacings.ptSm,
      ...spacings.pbSm,
      borderRadius: 12,
      backgroundColor: theme.tertiaryBackground
    },
    feePreviewLabel: {
      ...flexbox.alignStart
    },
    feeDetailsButton: {
      ...spacings.mtTy,
      ...spacings.mb0,
      // The tiny button vertical padding leaves less space than the text line height,
      // which pushes the text off the vertical center
      ...spacings.pv0,
      height: 24,
      borderColor: theme.primaryAccent300
    },
    feePreviewValues: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      columnGap: SPACING / 2
    },
    feePreviewOldFee: {
      textDecorationLine: 'line-through'
    },
    cardDetails: {
      rowGap: SPACING_SM
    }
  })

export default getStyles

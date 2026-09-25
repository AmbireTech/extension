import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  pendingWithdrawalCard: ViewStyle
  pendingWithdrawalIcon: ViewStyle
  pendingWithdrawalText: TextStyle
  pendingWithdrawalDescription: TextStyle
  missingDetailsForm: ViewStyle
  missingDetailsInput: ViewStyle
  missingDetailsInputWrapper: ViewStyle
  missingDetailsLookupText: TextStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    pendingWithdrawalCard: {
      ...flexbox.alignCenter,
      ...spacings.phMd,
      position: 'absolute',
      top: 0,
      right: 0,
      left: 0,
      zIndex: 1
    },
    pendingWithdrawalIcon: {
      ...flexbox.center,
      ...spacings.mbSm
    },
    pendingWithdrawalText: {
      ...spacings.mbTy,
      textAlign: 'center'
    },
    pendingWithdrawalDescription: {
      ...spacings.mtMd,
      maxWidth: 460,
      lineHeight: 20,
      textAlign: 'center'
    },
    missingDetailsForm: {
      ...spacings.mtMd,
      width: '100%',
      maxWidth: 460
    },
    missingDetailsInput: {
      ...spacings.mbTy
    },
    // The input's own background matches the card, so a border keeps it visible. The semantic
    // border tokens match the input's background (`secondaryBorder` is white in the light
    // theme), so this uses the neutral that other input-like fields use for their border
    missingDetailsInputWrapper: {
      borderColor: theme.neutral400
    },
    missingDetailsLookupText: {
      ...spacings.mtSm,
      textAlign: 'center'
    }
  })

export default getStyles

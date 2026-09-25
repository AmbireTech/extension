import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  pendingWithdrawalCard: ViewStyle
  pendingWithdrawalIcon: ViewStyle
  pendingWithdrawalText: TextStyle
  pendingWithdrawalDescription: TextStyle
  missingDetailsForm: ViewStyle
  missingDetailsInput: ViewStyle
  missingDetailsWarning: TextStyle
}

const getStyles = () =>
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
    missingDetailsWarning: {
      ...spacings.mbTy,
      lineHeight: 20,
      textAlign: 'center'
    }
  })

export default getStyles

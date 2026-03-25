import { StyleSheet, ViewStyle } from 'react-native'

import { isMobile } from '@common/config/env'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  accountButton: ViewStyle
  accountButtonRightIcon: ViewStyle
  accountCopyIcon: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Styles>({
    // Account
    accountButton: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      height: 40,
      ...spacings.plMi,
      ...(isMobile ? spacings.prTy : spacings.prSm),
      ...spacings.mrTy,
      borderRadius: 50
    },
    accountButtonRightIcon: {
      borderColor: 'transparent'
    },
    accountCopyIcon: { backgroundColor: 'transparent', borderColor: 'transparent' }
  })

export default getStyles

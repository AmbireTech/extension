import { Platform, StyleSheet, ViewStyle } from 'react-native'

import colors from '@modules/common/styles/colors'
import spacings from '@modules/common/styles/spacings'

interface Style {
  loadingContainer: ViewStyle
  spinnerWrapper: ViewStyle
  otherBalancesContainer: ViewStyle
  button: ViewStyle
  buttonIcon: ViewStyle
}

const styles = StyleSheet.create<Style>({
  button: {
    minWidth: 100,
    alignItems: Platform.OS === 'web' ? 'center' : 'flex-end',
    backgroundColor: colors.martinique,
    ...spacings.mhMi,
    ...spacings.ph0
  },
  buttonIcon: {
    marginRight: 3
  },
  loadingContainer: {
    // Reserves some initial height, so that it covers the common space,
    // which every user (even with balance 0) will have.
    height: 200
  },
  spinnerWrapper: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    ...spacings.mbTy
  },
  otherBalancesContainer: {
    flexDirection: 'row',
    width: 275,
    borderBottomColor: colors.waikawaGray,
    borderBottomWidth: 1,
    paddingVertical: 2,
    alignItems: 'center'
  }
})

export default styles

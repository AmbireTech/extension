import { StyleSheet, ViewStyle } from 'react-native'

import { isWeb } from '@common/config/env'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'

interface Style {
  loadingContainer: ViewStyle
  spinnerWrapper: ViewStyle
  allBalancesContainer: ViewStyle
  allBalancesGasTankContainer: ViewStyle
  button: ViewStyle
  buttonIcon: ViewStyle
}

const styles = StyleSheet.create<Style>({
  button: {
    minWidth: 100,
    alignItems: isWeb ? 'center' : 'flex-end',
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
  allBalancesContainer: {
    flexDirection: 'row',
    width: 275,
    borderBottomColor: colors.waikawaGray,
    borderBottomWidth: 1,
    paddingVertical: 2,
    alignItems: 'center'
  },
  allBalancesGasTankContainer: {
    borderTopColor: colors.waikawaGray,
    borderTopWidth: 1,
    borderBottomWidth: 0
  }
})

export default styles

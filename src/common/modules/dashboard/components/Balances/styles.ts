import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'

interface Style {
  loadingContainer: ViewStyle
  spinnerWrapper: ViewStyle
  allBalancesContainer: ViewStyle
  allBalancesGasTankContainer: ViewStyle
  button: ViewStyle
  buttonText: TextStyle
}

const styles = StyleSheet.create<Style>({
  button: {
    flexDirection: 'row',
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.martinique,
    borderRadius: BORDER_RADIUS_PRIMARY,
    height: 50,
    marginHorizontal: 8,
    ...spacings.phSm
  },
  buttonText: {
    marginRight: 8,
    lineHeight: 21
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

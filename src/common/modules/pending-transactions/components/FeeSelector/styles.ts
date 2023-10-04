import { StyleSheet, ViewStyle } from 'react-native'

import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import commonStyles from '@common/styles/utils/common'

interface Style {
  selectorsContainer: ViewStyle
  feeSelector: ViewStyle
  selected: ViewStyle
  customFeeContainer: ViewStyle
  unstableFeeContainer: ViewStyle
}

const styles = StyleSheet.create<Style>({
  selectorsContainer: {
    flexDirection: 'row',
    flex: 1,
    ...spacings.mbLg,
    marginHorizontal: -2.5
  },
  feeSelector: {
    ...spacings.phMi,
    minHeight: 95,
    flex: 1,
    marginHorizontal: 2.5,
    overflow: 'hidden',
    backgroundColor: colors.martinique,
    borderWidth: 2,
    borderColor: colors.martinique,
    alignItems: 'center',
    justifyContent: 'center',
    ...commonStyles.borderRadiusPrimary
  },
  customFeeContainer: {
    ...spacings.mbTy
  },
  unstableFeeContainer: {
    ...spacings.pvTy,
    ...spacings.phTy,
    ...commonStyles.borderRadiusPrimary,
    backgroundColor: colors.howl,
    flexDirection: 'row',
    alignItems: 'center'
  },
  selected: {
    borderColor: colors.turquoise
  }
})

export default styles

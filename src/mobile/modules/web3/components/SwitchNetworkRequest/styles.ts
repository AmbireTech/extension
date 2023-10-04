import { StyleSheet, ViewStyle } from 'react-native'

import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import commonStyles from '@common/styles/utils/common'

interface Style {
  buttonsContainer: ViewStyle
  buttonWrapper: ViewStyle
  permissionLabelWrapper: ViewStyle
  networkIconWrapper: ViewStyle
}

const styles = StyleSheet.create<Style>({
  buttonsContainer: {
    flexDirection: 'row',
    marginHorizontal: -5,
    ...spacings.mbTy
  },
  buttonWrapper: {
    marginHorizontal: 5,
    flex: 1
  },
  permissionLabelWrapper: {
    ...spacings.pvSm,
    ...spacings.phSm,
    ...commonStyles.borderRadiusPrimary,
    backgroundColor: colors.clay
  },
  networkIconWrapper: {
    ...spacings.mbTy,
    backgroundColor: colors.titan_05,
    ...commonStyles.borderRadiusPrimary
  }
})

export default styles

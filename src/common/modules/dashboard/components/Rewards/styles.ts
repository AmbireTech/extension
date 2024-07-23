import { StyleSheet, ViewStyle } from 'react-native'

import { isWeb } from '@common/config/env'
import colors from '@common/styles/colors'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import commonStyles from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  rewardTokenButton: ViewStyle
  tokenButtonContainer: ViewStyle
  tokenButtonIconWrapper: ViewStyle
  rewardFlag: ViewStyle
  tableContainer: ViewStyle
  tableRow: ViewStyle
  tableRowBorder: ViewStyle
  tableRowValue: ViewStyle
  warningRewardsContainer: ViewStyle
}

const styles = StyleSheet.create<Style>({
  rewardTokenButton: {
    ...flexbox.alignSelfCenter,
    backgroundColor: colors.titan_05,
    // So it matches the height of the token item send button
    minHeight: 36
  },
  tokenButtonContainer: {
    flexDirection: 'row',
    backgroundColor: colors.howl,
    ...spacings.pvSm,
    ...spacings.phSm,
    ...spacings.mbTy,
    ...commonStyles.borderRadiusPrimary,
    borderWidth: 1,
    borderColor: colors.heliotrope
  },
  tokenButtonIconWrapper: {
    backgroundColor: colors.titan_05,
    overflow: 'hidden',
    ...commonStyles.borderRadiusPrimary,
    ...flexbox.center,
    ...spacings.mrSm,
    width: 34,
    height: 34,
    alignSelf: 'center'
  },
  rewardFlag: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: -1
  },
  tableContainer: {
    marginHorizontal: isWeb ? 0 : -1 * SPACING_TY,
    ...commonStyles.borderRadiusPrimary,
    ...spacings.ph,
    ...spacings.pvTy
  },
  tableRow: {
    ...spacings.pvSm
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderColor: colors.waikawaGray
  },
  tableRowValue: {
    width: 160
  },
  warningRewardsContainer: {
    marginHorizontal: SPACING_TY,
    marginVertical: 0,
    borderWidth: 1,
    padding: 0,
    ...spacings.phTy,
    ...spacings.pvTy,
    borderColor: colors.heliotrope
  }
})

export default styles

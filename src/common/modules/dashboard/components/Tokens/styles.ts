import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import commonStyles from '@common/styles/utils/common'
import flexboxStyles from '@common/styles/utils/flexbox'

interface Style {
  tokenItemContainer: ViewStyle
  tokenItemContainerWeb: ViewStyle
  tokenContentContainer: ViewStyle
  tokenValue: ViewStyle
  sendContainer: ViewStyle
  pendingContainer: ViewStyle
  pendingContainerWrapper: ViewStyle
  pendingBalance: TextStyle
  onChainBalance: TextStyle
  tokenSymbol: TextStyle
  balance: TextStyle
  pendingItem: ViewStyle
}

const styles = StyleSheet.create<Style>({
  tokenItemContainer: {
    backgroundColor: colors.howl,
    ...spacings.pvSm,
    ...spacings.phSm,
    ...spacings.mbTy,
    ...commonStyles.borderRadiusPrimary
  },
  tokenItemContainerWeb: {
    backgroundColor: colors.howl,
    ...spacings.pvTy,
    ...spacings.phSm,
    ...spacings.mbTy,
    ...commonStyles.borderRadiusPrimary,
    ...flexboxStyles.alignCenter
  },
  tokenContentContainer: {
    flexDirection: 'row'
  },
  balance: {
    color: colors.turquoise
  },
  tokenSymbol: {
    // Magic number, so that the token name always takes up to 35% of the row,
    // otherwise - aligning the symbol and value with flex 1 both
    // results inconsistent rendering behavior with edge cases - long token name
    // and very tiny value (with many decimals). So this is the sweet spot.
    maxWidth: '40%'
  },
  tokenValue: {
    alignItems: 'flex-end'
  },
  sendContainer: {
    backgroundColor: colors.titan_05,
    width: 36,
    height: 36,
    ...flexboxStyles.center,
    ...commonStyles.borderRadiusPrimary
  },
  pendingContainer: {
    ...spacings.mtSm
  },
  pendingContainerWrapper: {
    alignItems: 'center'
  },
  pendingItem: {
    borderColor: colors.mustard,
    borderWidth: 1,
    color: colors.mustard,
    borderRadius: 20,
    ...flexboxStyles.flex1,
    ...spacings.phMi,
    ...spacings.pvMi,
    ...spacings.mbMi
  },
  pendingBalance: {
    color: colors.mustard
  },
  onChainBalance: {
    color: colors.turquoise_40
  }
})

export default styles

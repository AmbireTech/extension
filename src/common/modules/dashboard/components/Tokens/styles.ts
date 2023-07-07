import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import commonStyles from '@common/styles/utils/common'
import flexboxStyles from '@common/styles/utils/flexbox'

interface Style {
  tokenItemContainer: ViewStyle
  tokenItemContainerWeb: ViewStyle
  tokenValue: ViewStyle
  sendContainer: ViewStyle
  tokenSymbol: TextStyle
}

const styles = StyleSheet.create<Style>({
  tokenItemContainer: {
    flexDirection: 'row',
    backgroundColor: colors.howl,
    ...spacings.pvSm,
    ...spacings.phSm,
    ...spacings.mbTy,
    ...commonStyles.borderRadiusPrimary
  },
  tokenItemContainerWeb: {
    flexDirection: 'row',
    backgroundColor: colors.howl,
    ...spacings.pvTy,
    ...spacings.phSm,
    ...spacings.mbTy,
    ...commonStyles.borderRadiusPrimary,
    ...flexboxStyles.alignCenter
  },
  tokenSymbol: {
    // Magic number, so that the token name always takes up to 35% of the row,
    // otherwise - aligning the symbol and value with flex 1 both
    // results inconsistent rendering behavior with edge cases - long token name
    // and very tiny value (with many decimals). So this is the sweet spot.
    maxWidth: '35%'
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
  }
})

export default styles

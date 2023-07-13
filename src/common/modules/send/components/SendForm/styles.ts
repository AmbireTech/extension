import { StyleSheet, ViewStyle } from 'react-native'

import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import commonStyles from '@common/styles/utils/common'

interface Style {
  amountInTokenInputBackgroundStyle: ViewStyle
  amountInUSDInputBackgroundStyle: ViewStyle
}

const styles = StyleSheet.create<Style>({
  amountInTokenInputBackgroundStyle: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    marginRight: 5
  },
  amountInUSDInputBackgroundStyle: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0
  }
})

export default styles

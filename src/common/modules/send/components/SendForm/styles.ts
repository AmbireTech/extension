import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

interface Style {
  amountInTokenInputBackgroundStyle: ViewStyle
  amountInUSDInputBackgroundStyle: ViewStyle
  amountInUsdIcon: TextStyle
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
  },
  amountInUsdIcon: {
    lineHeight: 28,
    paddingLeft: 5
  }
})

export default styles

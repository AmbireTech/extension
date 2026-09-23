import { StyleSheet, ViewStyle } from 'react-native'

interface Styles {
  balanceLabel: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Styles>({
    balanceLabel: {
      // The balance keeps its size, so only the converted amount next to it gives way when it is
      // too long for the row
      flexShrink: 0
    }
  })

export default getStyles

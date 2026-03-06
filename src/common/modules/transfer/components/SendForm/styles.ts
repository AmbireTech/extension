import { StyleSheet, ViewStyle } from 'react-native'

interface Style {
  topUpContainer: ViewStyle
}

const styles = StyleSheet.create<Style>({
  topUpContainer: {
    maxWidth: '100%',
    width: '100%'
  }
})

export default styles

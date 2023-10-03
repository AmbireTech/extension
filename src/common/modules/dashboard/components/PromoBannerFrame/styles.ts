import { StyleSheet, ViewStyle } from 'react-native'

interface Style {
  content: ViewStyle
}

const styles = StyleSheet.create<Style>({
  content: {
    position: 'absolute',
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center'
  }
})

export default styles

import { StyleSheet, ViewStyle } from 'react-native'

interface Style {
  button: ViewStyle
}

const styles = StyleSheet.create<Style>({
  button: {
    width: 43,
    height: 48,
    position: 'absolute',
    top: 100,
    right: -20,
    zIndex: 100
  }
})

export default styles

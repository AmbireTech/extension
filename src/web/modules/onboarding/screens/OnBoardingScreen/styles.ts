import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

interface Style {
  title: TextStyle
  sideContent: ViewStyle
  pinExtension: ViewStyle
}

const styles = StyleSheet.create<Style>({
  title: {
    textAlign: 'center',
    position: 'relative',
    top: -205
  },
  sideContent: {
    position: 'relative',
    zIndex: -1
  },
  pinExtension: {
    position: 'fixed',
    right: 100,
    top: -1,
    zIndex: 10
  }
})

export default styles

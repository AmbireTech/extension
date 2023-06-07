import { StyleSheet, ViewStyle } from 'react-native'

interface Style {
  container: ViewStyle
  webview: ViewStyle
  loadingWrapper: ViewStyle
}

const styles = StyleSheet.create<Style>({
  container: {
    backgroundColor: 'transparent'
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  loadingWrapper: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }
})

export default styles

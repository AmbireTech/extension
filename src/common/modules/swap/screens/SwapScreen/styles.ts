import { StyleSheet, ViewStyle } from 'react-native'

interface Style {
  container: ViewStyle
  webview: ViewStyle
  loadingWrapper: ViewStyle
  statusContainer: ViewStyle
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
  },
  statusContainer: {
    position: 'absolute',
    zIndex: 1,
    top: 5,
    left: 0,
    right: 0,
    bottom: 0
  }
})

export default styles

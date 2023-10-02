import { StyleSheet, ViewStyle } from 'react-native'

interface Style {
  button: ViewStyle
}

export const BANNER_WIDTH = 43
export const BANNER_HEIGHT = 48

const styles = StyleSheet.create<Style>({
  button: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    top: 0,
    right: -20,
    zIndex: 100
  }
})

export default styles

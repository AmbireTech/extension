import { StyleSheet, ViewStyle } from 'react-native'

interface Style {
  topLeft: ViewStyle
  topRight: ViewStyle
  bottomLeft: ViewStyle
  bottomRight: ViewStyle
}

// The top-left frame's path, flipped into the other corners
const styles = StyleSheet.create<Style>({
  topLeft: { position: 'absolute', left: 0, top: 0 },
  topRight: { position: 'absolute', right: 0, top: 0, transform: [{ scaleX: -1 }] },
  bottomLeft: { position: 'absolute', left: 0, bottom: 0, transform: [{ scaleY: -1 }] },
  bottomRight: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    transform: [{ scaleX: -1 }, { scaleY: -1 }]
  }
})

export default styles

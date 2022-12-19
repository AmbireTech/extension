import { StyleSheet, ViewProps } from 'react-native'

interface Style {
  lottie: ViewProps
}

const styles = StyleSheet.create<Style>({
  lottie: {
    width: 45,
    height: 45,
    transform: [{ rotateZ: '-45deg' }]
  }
})

export default styles

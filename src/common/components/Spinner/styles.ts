import { StyleSheet, ViewStyle } from 'react-native'

interface Style {
  spinner: ViewStyle
}

const styles = StyleSheet.create<Style>({
  spinner: {
    width: 40,
    height: 40
  }
})

export default styles

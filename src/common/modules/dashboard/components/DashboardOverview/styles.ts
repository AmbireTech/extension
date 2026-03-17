import { StyleSheet, ViewStyle } from 'react-native'

interface Style {
  contentContainer: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    contentContainer: {}
  })

export default getStyles

import { StyleSheet, ViewStyle } from 'react-native'

interface Style {
  blurredPlaceholderQr: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    // Only a hint of the dummy QR is meant to show through the scrim on top of it
    blurredPlaceholderQr: { filter: 'blur(6px)' }
  })

export default getStyles

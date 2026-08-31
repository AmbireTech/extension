import { StyleSheet, ViewStyle } from 'react-native'

interface Style {
  blurred: ViewStyle
  notBlurred: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    // @ts-ignore web style
    blurred: { filter: 'blur(6px)' },
    // @ts-ignore web style
    notBlurred: { filter: 'blur(0px)' }
  })

export default getStyles

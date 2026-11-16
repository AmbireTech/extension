import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'

interface Style {
  modal: ViewStyle
  content: ViewStyle
  title: TextStyle
  description: TextStyle
  updateButton: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    modal: {
      maxWidth: 360
    },
    // The sheet's header with the X already spaces the content from the top
    content: {
      ...spacings.ph,
      ...spacings.pbXl
    },
    // `Text` resets the line height whenever it gets a custom font size
    title: {
      lineHeight: 28
    },
    description: {
      lineHeight: 18
    },
    updateButton: {
      width: 192,
      alignSelf: 'center'
    }
  })

export default getStyles

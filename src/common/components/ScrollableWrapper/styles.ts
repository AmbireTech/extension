import { StyleSheet, ViewStyle } from 'react-native'

import { SPACING_MI } from '@common/styles/spacings'

interface Style {
  wrapper: ViewStyle
  contentContainerStyle: ViewStyle
  contentContainerWithScrollbar: ViewStyle
}

const styles = () =>
  StyleSheet.create<Style>({
    wrapper: {
      flex: 1,
      backgroundColor: 'transparent'
    },
    contentContainerStyle: {
      flexGrow: 1
    },
    // Keeps the content off the scrollbar, so only applied on web while one is shown
    contentContainerWithScrollbar: {
      paddingRight: SPACING_MI / 2
    }
  })

export default styles

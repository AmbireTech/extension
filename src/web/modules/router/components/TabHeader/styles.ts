import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import colors from '@common/styles/colors'

interface Styles {
  container: ViewStyle
  title: TextStyle
}

const styles = StyleSheet.create<Styles>({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.zircon,
    alignItems: 'center'
  },
  title: {
    color: colors.martinique,
    textAlign: 'center',
    flex: 1
  }
})

export default styles

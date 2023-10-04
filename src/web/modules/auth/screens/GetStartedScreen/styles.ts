import { StyleSheet, ViewStyle } from 'react-native'

import colors from '@common/styles/colors'

interface Styles {
  hr: ViewStyle
  logo: ViewStyle
}

const styles = StyleSheet.create<Styles>({
  hr: {
    marginVertical: 70,
    height: 1,
    backgroundColor: colors.mischka
  },
  logo: {
    position: 'absolute',
    bottom: 27,
    right: '50%',
    marginRight: -46,
    zIndex: 10
  }
})

export default styles

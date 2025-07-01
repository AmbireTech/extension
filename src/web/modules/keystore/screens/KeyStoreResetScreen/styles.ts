import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'

interface Styles {
  logo: ViewStyle
  text: TextStyle
  currentEmailContainer: ViewStyle
  currentEmailLabel: TextStyle
  button: ViewStyle
}

const styles = StyleSheet.create<Styles>({
  logo: {
    ...spacings.mbXl
  },
  text: {
    ...spacings.mbMd,
    textAlign: 'center'
  },
  currentEmailContainer: {
    ...spacings.pvSm,
    ...spacings.phSm,
    borderRadius: 12
  },
  currentEmailLabel: {
    textAlign: 'center'
  },
  button: {
    width: 296
  }
})

export default styles

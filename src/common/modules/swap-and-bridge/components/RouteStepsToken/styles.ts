import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  amountWrapper: ViewStyle
  tokenContainer: ViewStyle
  text: TextStyle
}

const styles = StyleSheet.create<Style>({
  amountWrapper: {
    maxWidth: 120
  },
  text: {
    textAlign: 'center',
    // @ts-ignore missing in types, but it exists in React Native web
    whiteSpace: 'nowrap'
  },
  tokenContainer: {
    zIndex: 1,
    ...spacings.phMi,
    ...flexbox.alignSelfCenter,
    ...spacings.mbMi
  }
})

export default styles

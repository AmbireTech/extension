import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  noPositions: TextStyle
  noPositionsWrapper: ViewStyle
}

const styles = StyleSheet.create<Style>({
  noPositionsWrapper: {
    ...flexbox.flex1,
    ...flexbox.center
  },
  noPositions: {
    textAlign: 'center',
    ...flexbox.flex1,
    ...spacings.mtTy
  }
})

export default styles

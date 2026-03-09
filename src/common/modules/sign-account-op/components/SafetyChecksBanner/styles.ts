import { StyleSheet, ViewStyle } from 'react-native'

import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  container: ViewStyle
  spinner: ViewStyle
  iconContainer: ViewStyle
}

const styles = StyleSheet.create<Styles>({
  container: {
    ...flexbox.center,
    ...flexbox.flex1,
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 5
  },
  spinner: {
    width: 128,
    height: 128
  },
  iconContainer: {
    ...flexbox.center,
    ...flexbox.flex1,
    position: 'absolute'
  }
})

export default styles

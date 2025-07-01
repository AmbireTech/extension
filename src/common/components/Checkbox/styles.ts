import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  checkboxWrapper: ViewStyle
  checkbox: ViewStyle
  webCheckbox: ViewStyle
}

const styles = StyleSheet.create<Style>({
  container: {
    ...flexbox.directionRow,
    ...spacings.mb
  },
  checkboxWrapper: {
    // Because the rn-checkbox can't get smaller than 20
    //  it should be scaled down to ~18
    transform: [{ scale: 0.9 }],
    ...spacings.mrSm
  },
  checkbox: {
    width: 20,
    height: 20
  },
  webCheckbox: {
    overflow: 'hidden',
    borderRadius: 3,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20
  }
})

export default styles

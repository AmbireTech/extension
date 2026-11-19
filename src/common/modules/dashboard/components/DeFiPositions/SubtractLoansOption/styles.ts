import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

type Styles = {
  container: ViewStyle
  title: TextStyle
  toggleTrack: ViewStyle
}

const styles = StyleSheet.create<Styles>({
  container: {
    ...flexbox.directionRow,
    ...flexbox.alignCenter,
    ...flexbox.justifySpaceBetween,
    ...spacings.pvTy,
    ...spacings.phSm,
    ...spacings.mbTy,
    ...common.borderRadiusPrimary,
    borderWidth: 1
  },
  title: {
    ...spacings.mrSm,
    flexShrink: 1
  },
  toggleTrack: {
    marginRight: 0
  }
})

export default styles

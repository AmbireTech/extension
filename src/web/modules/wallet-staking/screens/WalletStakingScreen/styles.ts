import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  screenContent: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Styles>({
    screenContent: {
      ...flexbox.flex1,
      ...spacings.phSm,
      ...spacings.pbSm
    }
  })

export default getStyles

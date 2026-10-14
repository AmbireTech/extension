import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  screenContent: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Styles>({
    // `LayoutWrapper` already pads the bottom safe area here, so padding the bottom again would
    // lift the footer buttons higher than the Swap & Bridge ones
    screenContent: {
      ...flexbox.flex1,
      ...spacings.phSm
    }
  })

export default getStyles

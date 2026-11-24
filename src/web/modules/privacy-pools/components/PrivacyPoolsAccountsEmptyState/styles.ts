import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  description: TextStyle
}

/** Keeps the description on two balanced rows, as in the design */
const DESCRIPTION_MAX_WIDTH = 391

const getStyles = () =>
  StyleSheet.create<Style>({
    container: {
      ...flexbox.alignCenter,
      ...spacings.ptXl,
      ...spacings.phSm
    },
    description: {
      ...spacings.mb,
      maxWidth: DESCRIPTION_MAX_WIDTH,
      textAlign: 'center'
    }
  })

export default getStyles

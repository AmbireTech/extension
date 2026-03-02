import { ImageStyle, StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  backgroundImage: ImageStyle
  container: ViewStyle
  content: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    backgroundImage: {
      ...StyleSheet.absoluteFillObject,
      objectFit: 'cover'
    },
    container: {
      ...flexbox.flex1,
      ...flexbox.alignCenter,
      ...spacings.pb,
      ...spacings.ptXl,
      ...spacings.phLg
    },
    content: {
      maxWidth: 620,
      width: '100%'
    }
  })

export default getStyles

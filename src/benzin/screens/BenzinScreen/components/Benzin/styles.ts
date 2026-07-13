import { ImageStyle, StyleSheet, ViewStyle } from 'react-native'

import { isMobile, isWeb } from '@common/config/env'
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
      ...flexbox.alignCenter,
      ...(isWeb ? spacings.pb : {}),
      ...(isWeb ? spacings.ptXl : {}),
      ...(isWeb ? spacings.phLg : spacings.phSm),
      ...(isMobile ? spacings.plMd : {})
    },
    content: {
      maxWidth: 620,
      width: '100%'
    }
  })

export default getStyles

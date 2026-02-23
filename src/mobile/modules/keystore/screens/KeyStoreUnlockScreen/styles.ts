import { ImageStyle, StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  imageContainer: ViewStyle
  image: ImageStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    container: {
      maxWidth: 352,
      width: '100%',
      marginHorizontal: 'auto',
      ...flexbox.alignCenter
    },
    imageContainer: {
      height: 324,
      width: '100%',
      borderRadius: BORDER_RADIUS_PRIMARY,
      overflow: 'hidden',
      ...flexbox.center,
      ...spacings.mbLg
    },
    image: {
      width: '100%',
      height: '100%',
      position: 'absolute',
      objectFit: 'fill',
      top: 0,
      left: 0,
      zIndex: -1
    }
  })

export default getStyles

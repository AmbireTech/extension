import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'

interface Style {
  header: ViewStyle
  contentContainer: ViewStyle
  content: ViewStyle
}

// Constrains the screen to roughly the dashboard's width, so the overview card keeps the same
// proportions instead of stretching across a wide tab.
const CONTENT_MAX_WIDTH = 560

const getStyles = () =>
  StyleSheet.create<Style>({
    header: {
      ...spacings.phSm,
      ...spacings.ptSm
    },
    contentContainer: {
      ...spacings.phSm,
      ...spacings.pvSm
    },
    content: {
      width: '100%',
      maxWidth: CONTENT_MAX_WIDTH,
      alignSelf: 'center'
    }
  })

export default getStyles

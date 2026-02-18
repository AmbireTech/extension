import { StyleSheet, ViewStyle } from 'react-native'

import spacings, { SPACING_MD } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  panel: ViewStyle
  container: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    panel: {
      paddingTop: SPACING_MD * 2,
      ...spacings.pbLg
    },
    container: {
      maxWidth: 352,
      width: '100%',
      marginHorizontal: 'auto',
      ...flexbox.alignCenter
    }
  })

export default getStyles

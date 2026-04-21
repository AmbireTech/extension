import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  panel: ViewStyle
  container: ViewStyle
  biometricsContainer: ViewStyle
  biometricsIconButton: ViewStyle
  switchButton: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    panel: {
      ...spacings.ptSm,
      ...spacings.pbLg
    },
    container: {
      maxWidth: 352,
      width: '100%',
      marginHorizontal: 'auto',
      ...flexbox.alignCenter
    },
    biometricsContainer: {
      width: '100%',
      ...flexbox.alignCenter
    },
    biometricsIconButton: {
      width: 90,
      height: 90,
      borderRadius: 52,
      backgroundColor: '#F3F4F7',
      marginBottom: 30,
      ...flexbox.center
    },
    switchButton: {
      width: '100%'
    }
  })

export default getStyles

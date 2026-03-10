import { StyleSheet, ViewStyle } from 'react-native'

import { isWeb } from '@common/config/env'
import { SPACING_MI } from '@common/styles/spacings'

interface Style {
  wrapper: ViewStyle
  contentContainerStyle: ViewStyle
}

const styles = () =>
  StyleSheet.create<Style>({
    wrapper: {
      flex: 1,
      backgroundColor: 'transparent'
    },
    contentContainerStyle: {
      flexGrow: 1,
      paddingRight: isWeb ? SPACING_MI / 2 : 0
    }
  })

export default styles

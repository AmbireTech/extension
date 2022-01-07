import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import colors from '@modules/common/styles/colors'
import spacings from '@modules/common/styles/spacings'
import textStyles from '@modules/common/styles/utils/text'

interface Style {
  btnContainer: ViewStyle
  btn: TextStyle
}

const styles = StyleSheet.create<Style>({
  btnContainer: {
    backgroundColor: colors.secondaryButtonColor,
    ...spacings.phTy,
    ...spacings.pvTy
  },
  btn: {
    fontSize: 14,
    textTransform: 'uppercase',
    ...textStyles.bold
  }
})

export default styles

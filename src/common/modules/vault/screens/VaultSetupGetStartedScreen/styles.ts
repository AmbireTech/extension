import { StyleSheet, ViewStyle } from 'react-native'

import colors from '@common/styles/colors'

interface Style {
  dotStyle: ViewStyle
  activeDotStyle: ViewStyle
}

const styles = StyleSheet.create<Style>({
  dotStyle: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.titan,
    width: 14,
    height: 14,
    borderRadius: 50
  },
  activeDotStyle: {
    backgroundColor: colors.titan,
    borderWidth: 1,
    borderColor: colors.titan,
    width: 14,
    height: 14,
    borderRadius: 50
  }
})

export default styles

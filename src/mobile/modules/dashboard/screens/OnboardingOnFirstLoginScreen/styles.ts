import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'

interface Style {
  titleText: TextStyle
  descriptionText: TextStyle
  dotStyle: ViewStyle
  activeDotStyle: ViewStyle
}

const styles = StyleSheet.create<Style>({
  titleText: {
    textAlign: 'center',
    marginHorizontal: 40,
    ...spacings.mb,
    ...spacings.mt
  },
  descriptionText: {
    textAlign: 'center',
    marginBottom: 70,
    marginHorizontal: 40,
    ...spacings.mt
  },
  dotStyle: {
    backgroundColor: colors.clay
  },
  activeDotStyle: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.clay
  }
})

export default styles

import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'

interface Style {
  errorMessage: TextStyle
  numericContainer: ViewStyle
  numericButtonContainer: ViewStyle
  numericButton: ViewStyle
}

const styles = StyleSheet.create<Style>({
  errorMessage: {
    position: 'absolute',
    top: 12
  },
  numericContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: 360
  },
  numericButtonContainer: {
    width: '33.33%',
    alignItems: 'center'
  },
  numericButton: {
    ...spacings.mhTy,
    ...spacings.mvTy,
    ...spacings.pvTy,
    backgroundColor: colors.chetwode_50,
    maxWidth: 100,
    width: '100%',
    borderRadius: BORDER_RADIUS_PRIMARY
  }
})

export default styles

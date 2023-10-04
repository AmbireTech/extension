import { StyleSheet } from 'react-native'

import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'

const styles = StyleSheet.create({
  codeFieldRoot: {
    marginLeft: 'auto',
    marginRight: 'auto',
    ...spacings.pbSm,
    ...spacings.mbLg,
    ...spacings.mt
  },
  cellRoot: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomColor: colors.titan,
    borderBottomWidth: 1,
    ...spacings.mhMi
  },
  cellText: {
    color: colors.titan,
    fontSize: 25,
    textAlign: 'center'
  },
  focusCell: {
    borderBottomColor: colors.turquoise,
    borderBottomWidth: 1
  }
})

export default styles

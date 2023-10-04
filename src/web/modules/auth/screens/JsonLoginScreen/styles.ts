import { StyleSheet, ViewStyle } from 'react-native'

import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'

interface Styles {
  dropAreaContainer: ViewStyle
  dropArea: ViewStyle
}

const styles = StyleSheet.create<Styles>({
  dropAreaContainer: {
    width: '100%',
    height: 220,
    backgroundColor: colors.melrose_15,
    ...common.borderRadiusPrimary,
    ...spacings.ph,
    ...spacings.pv,
    ...common.shadowPrimary,
    borderWidth: 1,
    borderColor: colors.scampi_20,
    // @ts-ignore
    cursor: 'pointer',
    ...spacings.mbMd
  },
  dropArea: {
    borderRadius: 6,
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.violet,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 30,
    paddingBottom: 20
  }
})

export default styles

import { ImageStyle, StyleSheet, ViewStyle } from 'react-native'

import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'

interface Style {
  catalogItem: ViewStyle
  dappIcon: ImageStyle
  networkIcon: ViewStyle
  filterItem: ViewStyle
}

const styles = StyleSheet.create<Style>({
  catalogItem: {
    backgroundColor: colors.valhalla,
    ...common.borderRadiusPrimary,
    ...spacings.mbTy,
    ...spacings.phTy,
    ...spacings.pvTy
  },
  dappIcon: {
    width: 46,
    height: 46,
    borderRadius: 10
  },
  networkIcon: {
    borderRadius: 50,
    backgroundColor: colors.titan,
    borderColor: colors.valhalla,
    borderWidth: 2
  },
  filterItem: {
    height: 50,
    ...spacings.ph,
    ...common.borderRadiusPrimary,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center'
  }
})

export default styles

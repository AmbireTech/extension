import { ImageStyle, StyleSheet, ViewStyle } from 'react-native'

import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'

interface Style {
  catalogItem: ViewStyle
  disabledItem: ViewStyle
  dappIcon: ImageStyle
  networkIcon: ViewStyle
  catalogWrapper: ViewStyle
}

const styles = StyleSheet.create<Style>({
  catalogWrapper: {
    backgroundColor: colors.titanWhite,
    ...spacings.pv,
    ...spacings.mbMd
  },
  catalogItem: {
    backgroundColor: colors.white,
    borderColor: colors.snuff,
    borderWidth: 1,
    ...common.borderRadiusPrimary,
    ...spacings.mbTy,
    ...spacings.phTy,
    ...spacings.pvTy
  },
  disabledItem: {
    opacity: 0.2
  },
  dappIcon: {
    width: 46,
    height: 46,
    borderRadius: 10
  },
  networkIcon: {
    borderRadius: 50,
    backgroundColor: colors.white,
    borderColor: colors.snuff,
    borderWidth: 2
  }
})

export default styles

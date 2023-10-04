import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'

interface Style {
  itemContainer: ViewStyle
}

const styles = StyleSheet.create<Style>({
  itemContainer: {
    ...spacings.ph,
    ...spacings.pv,
    ...spacings.mhMd,
    ...common.borderRadiusPrimary,
    width: 200,
    height: 300,
    alignItems: 'center'
  }
})

export default styles

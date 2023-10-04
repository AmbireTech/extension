import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'

interface Style {
  filterItem: ViewStyle
}

const styles = StyleSheet.create<Style>({
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

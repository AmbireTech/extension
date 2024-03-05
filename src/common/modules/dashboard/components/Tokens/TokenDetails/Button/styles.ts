import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  action: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    action: {
      width: '25%',
      maxWidth: '25%',
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...spacings.phMi,
      ...spacings.pvSm,
      ...common.borderRadiusPrimary
    }
  })

export default getStyles

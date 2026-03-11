import { StyleSheet, ViewStyle } from 'react-native'

import { isMobile } from '@common/config/env'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  action: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    action: {
      width: isMobile ? 52 : 104,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...common.borderRadiusPrimary
    }
  })

export default getStyles

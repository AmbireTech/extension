import { StyleSheet, ViewStyle } from 'react-native'

import { isMobile } from '@common/config/env'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  action: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    action: isMobile
      ? {
          ...flexbox.center,
          ...common.borderRadiusPrimary,
          flex: 1,
          flexShrink: 1
        }
      : {
          width: 104,
          ...flexbox.alignCenter,
          ...flexbox.justifyCenter,
          ...common.borderRadiusPrimary
        }
  })

export default getStyles

import { StyleSheet, ViewStyle } from 'react-native'

import { isMobile } from '@common/config/env'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  action: ViewStyle
  actionCompact: ViewStyle
}

const compactActionStyle: ViewStyle = {
  ...common.borderRadiusPrimary,
  flex: 1,
  flexShrink: 1,
  minWidth: 0,
  alignItems: 'center'
}

const getStyles = () =>
  StyleSheet.create<Style>({
    action: isMobile
      ? compactActionStyle
      : {
          width: 104,
          ...flexbox.alignCenter,
          ...flexbox.justifyCenter,
          ...common.borderRadiusPrimary
        },
    actionCompact: compactActionStyle
  })

export default getStyles

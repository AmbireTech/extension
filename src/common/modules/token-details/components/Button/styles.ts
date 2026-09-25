import { StyleSheet, ViewStyle } from 'react-native'

import { isMobile } from '@common/config/env'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  action: ViewStyle
  actionCompact: ViewStyle
  actionSmall: ViewStyle
}

const ACTION_WIDTH = 104
// Used to fit a 5th action in the same footer width without switching to the flexible
// (stretching) compact layout, e.g. in the popup/expanded window.
const ACTION_SMALL_WIDTH = 83

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
          width: ACTION_WIDTH,
          ...flexbox.alignCenter,
          ...flexbox.justifyCenter,
          ...common.borderRadiusPrimary
        },
    actionCompact: compactActionStyle,
    actionSmall: {
      width: ACTION_SMALL_WIDTH,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...common.borderRadiusPrimary
    }
  })

export default getStyles

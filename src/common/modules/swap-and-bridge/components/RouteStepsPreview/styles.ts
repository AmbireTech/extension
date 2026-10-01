import { StyleSheet, ViewStyle } from 'react-native'

import flexbox from '@common/styles/utils/flexbox'

// The token label under each icon is absolutely positioned (see `labelAnchor`) and can
// render up to 2 lines (amount + symbol, then its $ value). This reserves enough space
// below the icons row so the label doesn't overlap the provider row underneath it.
export const TOKEN_LABEL_RESERVED_HEIGHT = 40

interface Style {
  container: ViewStyle
  iconsRow: ViewStyle
  labelAnchor: ViewStyle
  labelAnchorLeft: ViewStyle
  labelAnchorRight: ViewStyle
  labelAnchorCenter: ViewStyle
}

const styles = StyleSheet.create<Style>({
  container: {
    marginHorizontal: -5
  },
  iconsRow: {
    ...flexbox.directionRow,
    ...flexbox.alignCenter
  },
  labelAnchor: {
    position: 'absolute',
    top: '100%'
  },
  labelAnchorLeft: {
    left: 0,
    ...flexbox.alignStart
  },
  labelAnchorRight: {
    right: 0,
    ...flexbox.alignEnd
  },
  labelAnchorCenter: {
    left: 0,
    right: 0,
    ...flexbox.alignCenter
  }
})

export default styles

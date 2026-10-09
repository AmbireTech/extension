import { StyleSheet, ViewStyle } from 'react-native'

import flexbox from '@common/styles/utils/flexbox'

// The token label under each icon is absolutely positioned (see `labelAnchor`) and can
// render up to 2 lines (amount + symbol, then its $ value). This reserves enough space
// below the icons row so the label doesn't overlap the provider row underneath it.
export const TOKEN_LABEL_RESERVED_HEIGHT = 40

// How far the label anchor extends past its icon's box. Without it, the anchor is as
// narrow as the icon and on native (no `white-space: nowrap`) the label wraps into a
// column of short lines that overflows the reserved height above
const LABEL_ANCHOR_OVERFLOW = 120

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
    right: -LABEL_ANCHOR_OVERFLOW,
    ...flexbox.alignStart
  },
  labelAnchorRight: {
    left: -LABEL_ANCHOR_OVERFLOW,
    right: 0,
    ...flexbox.alignEnd
  },
  labelAnchorCenter: {
    left: -LABEL_ANCHOR_OVERFLOW / 2,
    right: -LABEL_ANCHOR_OVERFLOW / 2,
    ...flexbox.alignCenter
  }
})

export default styles

import { StyleSheet, ViewStyle } from 'react-native'

import { SPACING } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  detailRow: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Styles>({
    detailRow: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      columnGap: SPACING
    }
  })

export default getStyles

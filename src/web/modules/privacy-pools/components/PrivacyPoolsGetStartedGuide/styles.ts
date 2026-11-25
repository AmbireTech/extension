import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_SECONDARY } from '@common/styles/utils/common'

interface Style {
  sheet: ViewStyle
  illustrationCard: ViewStyle
  stepText: ViewStyle
  title: TextStyle
  description: TextStyle
  measuredTexts: ViewStyle
  measuredText: ViewStyle
  button: ViewStyle
}

const styles = StyleSheet.create<Style>({
  // As wide as in the design, also as a modal in a tab
  sheet: {
    maxWidth: 400
  },
  // The illustration draws its own card, so the step's card only spaces it from the text
  illustrationCard: {
    ...spacings.pv0,
    ...spacings.mbSm,
    borderRadius: BORDER_RADIUS_SECONDARY,
    overflow: 'hidden'
  },
  stepText: {
    ...spacings.phSm
  },
  // The design's line heights, which are tighter than the font's own, so the guide fits the popup
  title: {
    ...spacings.mbMi,
    lineHeight: 28
  },
  description: {
    lineHeight: 20
  },
  // Out of the flow and invisible: only measured
  measuredTexts: {
    height: 0,
    opacity: 0
  },
  measuredText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0
  },
  button: {
    width: 180,
    alignSelf: 'center'
  }
})

export default styles

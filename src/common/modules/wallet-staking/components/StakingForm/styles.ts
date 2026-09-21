import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings, { SPACING } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  mainContent: ViewStyle
  mainContentContent: ViewStyle
  learnMore: ViewStyle
  stakingFormContainer: ViewStyle
  loadingState: ViewStyle
  disabledStakingForm: ViewStyle
  details: ViewStyle
  validation: TextStyle
}

const getStyles = () =>
  StyleSheet.create<Styles>({
    // A ScrollView (not a plain View): on a fixed-height, non-scrolling screen, content taller
    // than the space left for it used to overflow visually into the footer below (flex children
    // don't push siblings down when they overflow their own box), overlapping the footer buttons.
    // Scrolling internally means mainContent's own box never grows past what layout gives it, so
    // the footer (pinned to the bottom via its own `marginTop: 'auto'`) is never overlapped.
    mainContent: {
      ...flexbox.flex1
    },
    mainContentContent: {
      flexGrow: 1
    },
    learnMore: {
      ...flexbox.directionRow,
      ...flexbox.justifyCenter,
      ...flexbox.wrap,
      ...spacings.mb
    },
    stakingFormContainer: {
      position: 'relative'
    },
    loadingState: {
      ...flexbox.flex1,
      ...flexbox.directionRow,
      ...flexbox.justifyCenter,
      columnGap: SPACING / 2,
      ...spacings.mt2Xl
    },
    disabledStakingForm: {
      opacity: 0.18
    },
    details: {
      ...spacings.phSm
    },
    validation: {
      ...spacings.mtTy,
      ...spacings.mlSm,
      minHeight: 16
    }
  })

export default getStyles

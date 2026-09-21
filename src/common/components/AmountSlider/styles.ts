import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  wrapper: ViewStyle
  slider: ViewStyle
  disabled: ViewStyle
  track: ViewStyle
  progressContainer: ViewStyle
  quarter: ViewStyle
  valueBubble: ViewStyle
  threshold: ViewStyle
  thumb: ViewStyle
  thumbInner: ViewStyle
}

const THUMB_SIZE = 20
const TRACK_HEIGHT = 8
const QUARTER_SIZE = TRACK_HEIGHT - 2
const THRESHOLD_HEIGHT = 16
const VALUE_BUBBLE_WIDTH = 48
// The thumb is the tallest part of the slider, so it sets the height and everything else is
// centered against it.
const centerOffset = (size: number) => (THUMB_SIZE - size) / 2

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    wrapper: {
      // An amount input above the slider may carry a zIndex of its own (see Input's styles), so
      // the bubble needs the whole slider lifted above it to not end up behind the input.
      zIndex: 11
    },
    slider: {
      ...flexbox.justifyCenter,
      height: THUMB_SIZE,
      position: 'relative'
    },
    disabled: {
      opacity: 0.5
    },
    track: {
      position: 'absolute',
      top: centerOffset(TRACK_HEIGHT),
      right: 0,
      left: 0,
      height: TRACK_HEIGHT,
      borderRadius: 4,
      backgroundColor: theme.tertiaryText
    },
    progressContainer: {
      position: 'absolute',
      top: centerOffset(TRACK_HEIGHT),
      left: 0,
      height: TRACK_HEIGHT,
      borderRadius: 4,
      overflow: 'hidden',
      flexDirection: 'row'
    },
    quarter: {
      position: 'absolute',
      top: centerOffset(QUARTER_SIZE),
      width: QUARTER_SIZE,
      height: QUARTER_SIZE,
      borderRadius: 50,
      backgroundColor: theme.neutral400
    },
    valueBubble: {
      position: 'absolute',
      top: -36,
      width: VALUE_BUBBLE_WIDTH,
      ...flexbox.center,
      ...spacings.pvMi,
      borderRadius: 11,
      backgroundColor: theme.primaryAccent100,
      // Lighter than every shadow in the common utils - just enough to lift the bubble off the
      // background behind it.
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2
    },
    threshold: {
      position: 'absolute',
      top: centerOffset(THRESHOLD_HEIGHT),
      width: 1,
      height: THRESHOLD_HEIGHT,
      backgroundColor: theme.secondaryBackground
    },
    thumb: {
      position: 'absolute',
      top: 0,
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: THUMB_SIZE / 2,
      backgroundColor: theme.primaryAccent200,
      ...flexbox.center
    },
    thumbInner: {
      width: THUMB_SIZE - 6,
      height: THUMB_SIZE - 6,
      borderRadius: THUMB_SIZE / 2,
      backgroundColor: theme.primaryAccent300
    }
  })

export default getStyles

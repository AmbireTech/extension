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
const VALUE_BUBBLE_WIDTH = 48

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    wrapper: {
      // An amount input above the slider may carry a zIndex of its own (see Input's styles), so
      // the bubble needs the whole slider lifted above it to not end up behind the input.
      zIndex: 11
    },
    slider: {
      ...flexbox.justifyCenter,
      height: 28,
      position: 'relative'
    },
    disabled: {
      opacity: 0.5
    },
    track: {
      position: 'absolute',
      top: 10,
      right: 0,
      left: 0,
      height: TRACK_HEIGHT,
      borderRadius: 4,
      backgroundColor: theme.tertiaryText
    },
    progressContainer: {
      position: 'absolute',
      top: 10,
      left: 0,
      height: TRACK_HEIGHT,
      borderRadius: 4,
      overflow: 'hidden',
      flexDirection: 'row'
    },
    quarter: {
      position: 'absolute',
      top: 11,
      width: TRACK_HEIGHT - 2,
      height: TRACK_HEIGHT - 2,
      borderRadius: 50,
      backgroundColor: theme.neutral400
    },
    valueBubble: {
      position: 'absolute',
      top: -32,
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
      top: 6,
      width: 1,
      height: 16,
      backgroundColor: theme.secondaryBackground
    },
    thumb: {
      position: 'absolute',
      top: 4,
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

import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  wrapper: ViewStyle
  slider: ViewStyle
  disabled: ViewStyle
  track: ViewStyle
  progressContainer: ViewStyle
  mark: ViewStyle
  percentage: ViewStyle
  thumb: ViewStyle
  thumbInner: ViewStyle
}

const THUMB_SIZE = 20
const TRACK_HEIGHT = 6
/** The dots' diameter: 1px short of the track on each side, so an end dot sits inside its rounded cap. */
export const MARK_SIZE = TRACK_HEIGHT - 2
const PERCENTAGE_MIN_WIDTH = 28
// The thumb is the tallest part of the slider, so it sets the height and everything else is
// centered against it.
const centerOffset = (size: number) => (THUMB_SIZE - size) / 2

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    wrapper: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter
    },
    slider: {
      ...flexbox.flex1,
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
      borderRadius: TRACK_HEIGHT / 2,
      backgroundColor: hexToRgba(theme.tertiaryText, 0.6)
    },
    progressContainer: {
      position: 'absolute',
      top: centerOffset(TRACK_HEIGHT),
      left: 0,
      height: TRACK_HEIGHT,
      borderRadius: TRACK_HEIGHT / 2,
      overflow: 'hidden',
      flexDirection: 'row'
    },
    mark: {
      position: 'absolute',
      top: centerOffset(MARK_SIZE),
      width: MARK_SIZE,
      height: MARK_SIZE,
      borderRadius: 50,
      backgroundColor: theme.secondaryBackground
    },
    percentage: {
      // Wide enough for "100%" and left-aligned, so the text grows to the right and the track
      // keeps its width as the percentage changes
      minWidth: PERCENTAGE_MIN_WIDTH,
      alignItems: 'center',
      justifyContent: 'center',
      ...spacings.mlTy
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

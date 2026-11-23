import { StyleSheet, ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'
import { BORDER_RADIUS_SECONDARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

/** The width of the illustration in the design, which the ray's geometry is measured in */
export const DESIGN_WIDTH = 352
export const HEIGHT = 220
/** Wider than the illustration, so the ray never shows its edge while it slides */
export const RAY_WIDTH = 450

interface Style {
  frame: ViewStyle
  rayLayer: ViewStyle
  content: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    frame: {
      width: '100%',
      height: HEIGHT,
      borderRadius: BORDER_RADIUS_SECONDARY,
      overflow: 'hidden',
      backgroundColor: theme.secondaryBackground
    },
    // In percent of the illustration, so the ray scales with it without measuring it
    rayLayer: {
      position: 'absolute',
      top: 0,
      left: 0,
      height: HEIGHT,
      width: `${(RAY_WIDTH / DESIGN_WIDTH) * 100}%`,
      transitionProperty: 'transform',
      transitionDuration: '400ms',
      // Moving it only recomposites the ray rather than repainting it every frame
      willChange: 'transform'
    } as ViewStyle,
    content: {
      ...StyleSheet.absoluteFill,
      ...flexbox.center
    }
  })

export default getStyles

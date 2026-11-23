import React, { ReactNode } from 'react'
import { Image, ImageSourcePropType, View, ViewStyle } from 'react-native'

import useTheme from '@common/hooks/useTheme'
import PrivacyPoolsCornerFrames from '@web/modules/privacy-pools/components/PrivacyPoolsCornerFrames'

import rayImage from './ray.png'
import getStyles, { DESIGN_WIDTH, RAY_WIDTH } from './styles'

/**
 * How far the ray slides to the left by the last step, in percent of its own width: almost
 * all of what it is wider than the illustration, so its edge never shows
 */
const RAY_TRAVEL = ((RAY_WIDTH - DESIGN_WIDTH) / RAY_WIDTH) * 0.95 * 100

// Fixed, not theme colors: the frames glow white in both themes
const CORNER_COLOR = '#FFFFFF'
const CORNER_GLOW_BLUR = 4
const CORNER_INSET = 6
/** As in the design: the frames curve a bit wider than the illustration's own corners */
const CORNER_RADIUS = 14

interface Props {
  /**
   * How far along the guide its step is, from 0 on the first step to 1 on the last. The ray
   * slides from right to left with it, so the light falls differently on every step.
   */
  progress: number
  /** Centered on the illustration */
  children: ReactNode
}

/**
 * The illustration card of a step of the Privacy Pools guide: the design's light ray over the
 * theme's background, with glowing frames in its corners. Every step renders it in the same place,
 * so the same instance stays mounted and the ray slides to the new step's place.
 *
 * The ray image is the design's whole ray layer, wider than the illustration, as its filters and
 * shader paint it (the same in both themes), at three times its size for dense screens.
 */
const PrivacyPoolsGuideIllustration = ({ progress, children }: Props) => {
  const { styles } = useTheme(getStyles)
  // A transform's percentages are of the ray's own width
  const rayStyle: ViewStyle = { transform: [{ translateX: `${-progress * RAY_TRAVEL}%` }] }

  return (
    <View style={styles.frame}>
      <View style={[styles.rayLayer, rayStyle]}>
        <Image source={rayImage as ImageSourcePropType} resizeMode="cover" style={styles.ray} />
      </View>
      <View style={styles.content}>{children}</View>
      {/* Over the content, as in the design */}
      <PrivacyPoolsCornerFrames
        color={CORNER_COLOR}
        glowBlur={CORNER_GLOW_BLUR}
        insetX={CORNER_INSET}
        insetTop={CORNER_INSET}
        insetBottom={CORNER_INSET}
        cornerRadius={CORNER_RADIUS}
      />
    </View>
  )
}

export default React.memo(PrivacyPoolsGuideIllustration)

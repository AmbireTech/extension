import { StyleSheet, ViewStyle } from 'react-native'

import { COLLAPSED_HEIGHT, COLLAPSED_WIDTH, PILL_ASSET_HEIGHT, PILL_ASSET_WIDTH } from './constants'

// How far above/below the 36px pill the slide-clip box extends, so content taller than
// the pill (the promo icon) has room to render unclipped. CSS only lets `overflow` clip
// both axes together - setting `overflow-x: hidden` with `overflow-y: visible` doesn't
// give true unclipped vertical overflow (the spec computes the `visible` axis as `auto`
// instead, which still clips). So instead of clipping on `container` itself, the slide
// content is wrapped in `slideClip`, a box deliberately taller than the pill with plenty
// of headroom, clipped on both axes - since nothing ever reaches its top/bottom edges,
// it behaves as horizontal-only clipping in practice.
const VERTICAL_CLIP_MARGIN = 12

interface Style {
  container: ViewStyle
  slideClip: ViewStyle
  headerRow: ViewStyle
  borderClip: ViewStyle
  borderLayer: ViewStyle
}

const styles = StyleSheet.create<Style>({
  // Fixed position/size - this is the hover-detection box, and it must never move or
  // resize in response to hover, or the pill sliding under a stationary cursor would
  // cross the box's own edge mid-transition and fire a spurious hover-out (a feedback
  // loop that made the reveal flicker/never settle). Only `headerRow` inside it slides.
  container: {
    position: 'absolute',
    top: 103,
    right: 0,
    width: COLLAPSED_WIDTH,
    height: COLLAPSED_HEIGHT,
    // One above FloatingBottomBar's zIndex: 3, so the two never fight for stacking
    // order on the tabs where both are mounted.
    zIndex: 5
  },
  slideClip: {
    position: 'absolute',
    top: -VERTICAL_CLIP_MARGIN,
    left: 0,
    width: COLLAPSED_WIDTH,
    height: COLLAPSED_HEIGHT + VERTICAL_CLIP_MARGIN * 2,
    overflow: 'hidden'
  },
  headerRow: {
    marginTop: VERTICAL_CLIP_MARGIN,
    height: COLLAPSED_HEIGHT,
    width: COLLAPSED_WIDTH
  },
  // Narrower than `container`/`headerRow` on purpose - the border/background pill asset
  // stays at its native width instead of stretching to fill the wider banner, so the
  // banner's own right portion is left plain (no border reaches that far).
  borderClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: PILL_ASSET_WIDTH,
    height: COLLAPSED_HEIGHT,
    overflow: 'hidden'
  },
  // The gradient-border asset renders at its native (taller) height - shift it up so its
  // 36px-tall pill body is vertically centered in this shorter box, symmetrically cropping
  // the glow-bleed margin off the top/bottom via `borderClip`'s overflow:hidden.
  borderLayer: {
    position: 'absolute',
    top: -(PILL_ASSET_HEIGHT - COLLAPSED_HEIGHT) / 2,
    left: 0
  }
})

export default styles

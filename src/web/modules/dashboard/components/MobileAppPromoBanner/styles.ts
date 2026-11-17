import { StyleSheet, ViewStyle } from 'react-native'

import { COLLAPSED_HEIGHT, COLLAPSED_WIDTH, PILL_ASSET_HEIGHT, PILL_ASSET_WIDTH } from './constants'

// How far above/below the 36px pill `container` extends, so content taller than the pill
// (the promo icon) has room to render unclipped. CSS only lets `overflow` clip both axes
// together - setting `overflow-x: hidden` with `overflow-y: visible` doesn't give true
// unclipped vertical overflow (the spec computes the `visible` axis as `auto` instead,
// which still clips). So `container` is deliberately taller than the pill with plenty of
// headroom, clipped on both axes - since nothing ever reaches its top/bottom edges, it
// behaves as horizontal-only clipping in practice.
const VERTICAL_CLIP_MARGIN = 12

interface Style {
  container: ViewStyle
  headerRow: ViewStyle
  borderClip: ViewStyle
  borderLayer: ViewStyle
}

const styles = StyleSheet.create<Style>({
  // This is the hover-detection box, and its `width` is the animated hover value (see
  // MobileAppPromoBanner) - collapsed, it's exactly PEEK_WIDTH, so only the actually
  // visible sliver is hoverable, not the full pill's worth of empty space beside it.
  // `overflow: hidden` then clips `headerRow` (always rendered at its full, fixed width)
  // down to whatever's currently visible - collapsed, that's its own leftmost PEEK_WIDTH.
  container: {
    position: 'absolute',
    top: 103 - VERTICAL_CLIP_MARGIN,
    right: 0,
    height: COLLAPSED_HEIGHT + VERTICAL_CLIP_MARGIN * 2,
    overflow: 'hidden',
    // One above FloatingBottomBar's zIndex: 3, so the two never fight for stacking
    // order on the tabs where both are mounted.
    zIndex: 5
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

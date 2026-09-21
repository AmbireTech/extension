// Overall banner box width. Wider than the border/background pill asset itself
// (PILL_ASSET_WIDTH) - the extra room on the right is plain (no border drawn there),
// so the border intentionally doesn't reach the banner's own right edge.
export const COLLAPSED_WIDTH = 201
// The border/background pill asset's own width (AnimatedGradientBorder generates its
// stadium-shape path at this size) - independent of COLLAPSED_WIDTH so the border can be
// narrower or wider than the overall banner without either one distorting the other.
export const PILL_ASSET_WIDTH = 225
// The banner's actual box height. The reference design's pill asset (AnimatedGradientBorder's
// hardcoded path data) is authored in a taller 154x48 canvas with a 6px glow-bleed margin
// above/below the 36px-tall pill body, so it renders at its native 48px height and gets
// shifted/cropped to align with this shorter box - see AnimatedGradientBorder/styles.ts.
export const COLLAPSED_HEIGHT = 36
export const PILL_ASSET_HEIGHT = 48
// Collapsed/idle: only this many px of the pill sit inside the visible dashboard -
// the rest hangs off the right edge, clipped by LayoutWrapper's overflow:hidden card.
export const PEEK_WIDTH = 48

export const PILL_FILL = '#2B273D'
export const GRADIENT_CYAN = '#7AFFF9'
export const GRADIENT_PURPLE = '#9D7AFF'
export const PILL_TEXT_COLOR = '#FFFFFF'

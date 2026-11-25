/**
 * The size of the round buttons in a header, the same on every platform: the 40dp of a
 * Material icon button, a bit smaller than iOS's 44pt; their `hitSlop` keeps the tap area above
 * 44. The title keeps clear of them.
 */
export const HEADER_BUTTON_SIZE = 40

/** The stroke of the header icons, the 1.5 of the app's other icons at their 24px */
const HEADER_ICON_STROKE = 1.5

/** The `strokeWidth` an icon drawn in a `viewBoxSize` box needs at `size` to render as thick as the others */
export const getHeaderIconStrokeWidth = (viewBoxSize: number, size: number) =>
  (HEADER_ICON_STROKE * viewBoxSize) / size

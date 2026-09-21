/** A Lottie colour: red, green, blue and alpha, each from 0 to 1. */
type LottieColor = [number, number, number, number]

interface LottieShape {
  ty: string
  c?: { a: number; k: LottieColor }
  it?: LottieShape[]
  shapes?: LottieShape[]
}

interface LottieAnimation {
  layers: LottieShape[]
}

const HEX_SHORTHAND_LENGTH = 3
const HEX_FULL_LENGTH = 6
const MAX_CHANNEL = 255

/**
 * Parses a `#rgb` or `#rrggbb` colour into Lottie's 0 to 1 channels. Returns null for anything
 * else, so a caller can leave the animation alone rather than paint it a wrong colour.
 */
export const parseHexColor = (hex: string): LottieColor | null => {
  const digits = hex.trim().replace('#', '')
  const isShorthand = digits.length === HEX_SHORTHAND_LENGTH

  if (!isShorthand && digits.length !== HEX_FULL_LENGTH) return null
  if (!/^[0-9a-f]+$/i.test(digits)) return null

  const expanded = isShorthand
    ? digits
        .split('')
        .map((digit) => digit + digit)
        .join('')
    : digits

  return [
    parseInt(expanded.slice(0, 2), 16) / MAX_CHANNEL,
    parseInt(expanded.slice(2, 4), 16) / MAX_CHANNEL,
    parseInt(expanded.slice(4, 6), 16) / MAX_CHANNEL,
    1
  ]
}

const recolorShapes = (shapes: LottieShape[], color: LottieColor): void => {
  shapes.forEach((shape) => {
    // Strokes and fills are the only shapes that carry a colour
    if ((shape.ty === 'st' || shape.ty === 'fl') && shape.c) {
      shape.c = { a: 0, k: color }
    }

    if (shape.it) recolorShapes(shape.it, color)
    if (shape.shapes) recolorShapes(shape.shapes, color)
  })
}

/**
 * Returns a copy of a Lottie animation with every stroke and fill set to `hex`, so a component can
 * tint an imported animation with a theme colour.
 *
 * The animation passed in is never modified, since it is an imported module shared by every caller.
 * If `hex` can't be parsed the copy keeps the colours the asset was authored with.
 */
export const recolorLottie = <T>(animation: T, hex: string): T => {
  const copy = JSON.parse(JSON.stringify(animation)) as T & LottieAnimation
  const color = parseHexColor(hex)

  if (color) recolorShapes(copy.layers, color)

  return copy
}

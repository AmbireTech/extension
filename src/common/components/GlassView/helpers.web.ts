import { hexToRgba } from '@common/styles/utils/common'

// ---------------------------------------------------------------------------
// Specular map cache
// Key: dimensions + visual params.
// ---------------------------------------------------------------------------

const MAX_SPECULAR_CACHE = 20
const specularCache = new Map<string, string>()

function buildSpecularKey(opts: SpecularMapOptions): string {
  const w = Math.round(opts.width / 4) * 4
  const h = Math.round(opts.height / 4) * 4
  return `${w}_${h}_${opts.radius}_${opts.bezelWidth ?? opts.radius}_${opts.lightAngleDeg ?? 45}_${opts.strength ?? 1}_${opts.tintHex ?? '#ffffff'}`
}

export function getCachedSpecularMap(opts: SpecularMapOptions): string | undefined {
  return specularCache.get(buildSpecularKey(opts))
}

export function setCachedSpecularMap(opts: SpecularMapOptions, dataUrl: string): void {
  if (specularCache.size >= MAX_SPECULAR_CACHE) {
    specularCache.delete(specularCache.keys().next().value!)
  }
  specularCache.set(buildSpecularKey(opts), dataUrl)
}

// ---------------------------------------------------------------------------
// Shared DOM SVG filter registry
// Filters are injected once into a hidden <svg> in <head> and referenced by
// id (e.g. url(#glass-displace-r12-d2-s100-ca3)). The browser compiles each
// filter graph once and shares it across all elements using the same id.
// Ref-counted so the node is removed when the last consumer unmounts.
// ---------------------------------------------------------------------------

const injectedFilters = new Map<string, number>()
let sharedSvgEl: SVGSVGElement | null = null

function getSharedSvg(): SVGSVGElement {
  if (sharedSvgEl && sharedSvgEl.isConnected) return sharedSvgEl
  sharedSvgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  sharedSvgEl.setAttribute('aria-hidden', 'true')
  Object.assign(sharedSvgEl.style, {
    position: 'absolute',
    width: '0',
    height: '0',
    overflow: 'hidden',
    pointerEvents: 'none'
  })
  document.head.appendChild(sharedSvgEl)
  return sharedSvgEl
}

export function getOrInjectDisplacementFilter(opts: DisplacementOptions): string {
  const id = buildFilterId(opts)
  const refCount = injectedFilters.get(id) ?? 0
  if (refCount === 0) injectFilter(id, opts)
  injectedFilters.set(id, refCount + 1)
  return `url(#${id})`
}

export function releaseDisplacementFilter(filterId: string): void {
  const refCount = injectedFilters.get(filterId) ?? 0
  if (refCount <= 1) {
    injectedFilters.delete(filterId)
    const node = sharedSvgEl?.getElementById(filterId)
    node?.parentElement?.removeChild(node)
  } else {
    injectedFilters.set(filterId, refCount - 1)
  }
}

export function buildFilterId({
  width,
  height,
  radius,
  depth,
  strength = 100,
  chromaticAberration = 0
}: DisplacementOptions): string {
  // Round to nearest pixel — sub-pixel layout differences share the same filter.
  return `glass-displace-w${Math.round(width)}-h${Math.round(height)}-r${radius}-d${depth}-s${strength}-ca${chromaticAberration}`
}

function injectFilter(id: string, opts: DisplacementOptions): void {
  const { radius, depth, strength = 100, chromaticAberration = 0 } = opts
  const width = Math.round(opts.width)
  const height = Math.round(opts.height)
  const svg = getSharedSvg()
  const ns = 'http://www.w3.org/2000/svg'

  const filter = document.createElementNS(ns, 'filter')
  filter.setAttribute('id', id)
  filter.setAttribute('x', '0')
  filter.setAttribute('y', '0')
  filter.setAttribute('width', String(width))
  filter.setAttribute('height', String(height))
  filter.setAttribute('colorInterpolationFilters', 'sRGB')
  filter.setAttribute('filterUnits', 'userSpaceOnUse')

  const dmDataUrl = getDisplacementMap({ height, width, radius, depth })

  const makeDisplace = (scale: number, result: string) => {
    const fe = document.createElementNS(ns, 'feDisplacementMap')
    fe.setAttribute('in', 'SourceGraphic')
    fe.setAttribute('in2', 'displacementMap')
    fe.setAttribute('scale', String(scale))
    fe.setAttribute('xChannelSelector', 'R')
    fe.setAttribute('yChannelSelector', 'G')
    fe.setAttribute('result', result)
    return fe
  }

  const makeColorMatrix = (inResult: string, channel: 'R' | 'G' | 'B', result: string) => {
    const fe = document.createElementNS(ns, 'feColorMatrix')
    fe.setAttribute('in', inResult)
    fe.setAttribute('type', 'matrix')
    const r = channel === 'R' ? 1 : 0
    const g = channel === 'G' ? 1 : 0
    const b = channel === 'B' ? 1 : 0
    fe.setAttribute('values', `${r} 0 0 0 0  0 ${g} 0 0 0  0 0 ${b} 0 0  0 0 0 1 0`)
    fe.setAttribute('result', result)
    return fe
  }

  const feImage = document.createElementNS(ns, 'feImage')
  feImage.setAttribute('x', '0')
  feImage.setAttribute('y', '0')
  feImage.setAttribute('width', String(width))
  feImage.setAttribute('height', String(height))
  feImage.setAttribute('preserveAspectRatio', 'none')
  feImage.setAttribute('href', dmDataUrl)
  feImage.setAttribute('result', 'displacementMap')

  const dispR = makeDisplace(strength + chromaticAberration * 2, 'dispR')
  const matR = makeColorMatrix('dispR', 'R', 'displacedR')
  const dispG = makeDisplace(strength + chromaticAberration, 'dispG')
  const matG = makeColorMatrix('dispG', 'G', 'displacedG')
  const dispB = makeDisplace(strength, 'dispB')
  const matB = makeColorMatrix('dispB', 'B', 'displacedB')

  const blendRG = document.createElementNS(ns, 'feBlend')
  blendRG.setAttribute('in', 'displacedR')
  blendRG.setAttribute('in2', 'displacedG')
  blendRG.setAttribute('mode', 'screen')

  const blendB = document.createElementNS(ns, 'feBlend')
  blendB.setAttribute('in2', 'displacedB')
  blendB.setAttribute('mode', 'screen')

  filter.append(feImage, dispR, matR, dispG, matG, dispB, matB, blendRG, blendB)
  svg.appendChild(filter)
}

export type DisplacementOptions = {
  height: number
  width: number
  radius: number
  depth: number
  strength?: number
  chromaticAberration?: number
}

export type SpecularMapOptions = {
  /** Rendered pixel width of the element */
  width: number
  /** Rendered pixel height of the element */
  height: number
  /** Border-radius (px) – also controls the default bezel width */
  radius: number
  /**
   * How wide the glass bezel (rim) is in pixels.
   * Defaults to `radius` when omitted.
   */
  bezelWidth?: number
  /**
   * Angle (degrees, screen-space convention where Y increases downward).
   */
  lightAngleDeg?: number
  /** Overall brightness multiplier (default 1). */
  strength?: number
  /** Hex colour to tint the highlight (default '#ffffff'). */
  tintHex?: string
}

// ---------------------------------------------------------------------------
// Signed-distance function for a rounded rectangle.
// Returns < 0 inside, > 0 outside, ≈ 0 on the boundary.
// ---------------------------------------------------------------------------
function sdRoundedRect(
  px: number,
  py: number,
  cx: number,
  cy: number,
  hw: number,
  hh: number,
  r: number
): number {
  const dx = Math.max(Math.abs(px - cx) - hw, 0)
  const dy = Math.max(Math.abs(py - cy) - hh, 0)
  return Math.sqrt(dx * dx + dy * dy) - r
}

/**
 * Generates a physics-based specular highlight map via an off-screen Canvas.
 *
 * For every pixel inside the bezel region:
 *  1. The outward surface normal is estimated as the normalised SDF gradient.
 *  2. `dot(normal, lightDir)` gives the directional specular intensity — this
 *     is the same "rim-light" technique described in kube.io/blog/liquid-glass-css-svg/.
 *  3. A radial falloff envelope makes the highlight peak at the outer rim and
 *     fade smoothly toward the flat interior, matching the physical curvature
 *     of the glass bezel.
 *
 * Returns a PNG data-URL
 */
export function generateSpecularMap({
  width,
  height,
  radius,
  bezelWidth,
  lightAngleDeg = 45,
  strength = 1,
  tintHex = '#ffffff'
}: SpecularMapOptions): string {
  const bw = bezelWidth ?? radius

  // Render at 4× CSS pixel size (supersampling). CSS background-size: 100% 100%
  // downscales it back to the element's CSS size, which acts as a free 4× AA
  // pass — perfectly rotationally symmetric, so both corners look equally smooth.
  const ss = 4
  const pw = Math.round(width * ss)
  const ph = Math.round(height * ss)
  const pr = radius * ss
  const pbw = bw * ss

  const canvas = document.createElement('canvas')
  canvas.width = pw
  canvas.height = ph
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.createImageData(pw, ph)
  const data = imageData.data

  // Shape geometry (in physical pixels)
  const cx = pw / 2
  const cy = ph / 2
  const hw = Math.max(0, pw / 2 - pr)
  const hh = Math.max(0, ph / 2 - pr)

  const rgb = hexToRgba(tintHex, 1)
  const [tR = 255, tG = 255, tB = 255] = rgb.match(/\d+/g)?.map(Number) || []

  // ---------------------------------------------------------------------------
  // Two corner hotspots.
  //
  // A directional dot-product lights an entire straight edge uniformly — no
  // falloff along it. Instead we use an angular falloff that peaks at the two
  // hotspot corners and fades as we travel around the rim away from each one.
  //
  // The primary hotspot is driven by lightAngleDeg so callers can choose which
  // corner is brightest.
  // ---------------------------------------------------------------------------
  const primaryRad = (lightAngleDeg * Math.PI) / 180
  const secondaryRad = primaryRad + Math.PI

  // Helper: wrap angle difference to [-π, π]
  const wrapDiff = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b))

  // 4-supersampled-pixel fringe for smooth AA at both edges
  const eps = 4.0

  for (let py = 0; py < ph; py++) {
    for (let px = 0; px < pw; px++) {
      const sdf = sdRoundedRect(px, py, cx, cy, hw, hh, pr)

      // Bezel band + smooth fringe on both edges
      if (sdf > eps || sdf < -(pbw + eps)) continue

      // Angular position of this rim pixel relative to the shape centre.
      // This is what drives the corner-focused falloff: pixels near the
      // top-left corner have an angle close to primaryRad, so they get the
      // strongest intensity; pixels on the far side of the rim are ≈ 180° away
      // and get near-zero weight — producing the "fades from the corner" look.
      const pixelAngle = Math.atan2(py - cy, px - cx)

      // Angular distance to each hotspot, in [0, π]
      const dPrimary = Math.abs(wrapDiff(pixelAngle, primaryRad))
      const dSecondary = Math.abs(wrapDiff(pixelAngle, secondaryRad))

      // Identical formula for both corners — same power, same weight, just
      // mirrored angles. This guarantees both hotspots look exactly the same.
      const primary = Math.pow(Math.max(0, Math.cos(dPrimary)), 2) * 0.4
      const secondary = Math.pow(Math.max(0, Math.cos(dSecondary)), 2) * 0.4
      const angularIntensity = Math.max(primary, secondary)

      // Exponential radial falloff: bright at the outer rim, near-zero inward
      const rimT = Math.max(0, -sdf) / pbw
      const radialFalloff = Math.exp(-8 * rimT)

      // Smooth outer edge (sdf: +eps → 0)
      const outerAA = Math.max(0, Math.min(1, (eps - sdf) / eps))
      // Smooth inner edge (sdf: -pbw → -(pbw+eps))
      const innerAA = Math.max(0, Math.min(1, (sdf + pbw + eps) / eps))

      const intensity = Math.min(
        1.0,
        angularIntensity * radialFalloff * outerAA * innerAA * strength * 2.5
      )

      const idx = (py * pw + px) * 4
      data[idx] = tR
      data[idx + 1] = tG
      data[idx + 2] = tB
      data[idx + 3] = Math.round(intensity * 255)
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

/**
 * Creating the displacement map that is used by feDisplacementMap filter.
 * Gradients take into account the radius of the element.
 * This is why they start and end in the middle of the angle curve.
 */
export const getDisplacementMap = ({
  height,
  width,
  radius,
  depth
}: Omit<DisplacementOptions, 'chromaticAberration' | 'strength'>) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <style>
        .mix { mix-blend-mode: screen; }
    </style>
    <defs>
        <linearGradient 
          id="Y" 
          x1="0" 
          x2="0" 
          y1="${Math.ceil((radius / height) * 15)}%" 
          y2="${Math.floor(100 - (radius / height) * 15)}%">
            <stop offset="0%" stop-color="#0F0" />
            <stop offset="100%" stop-color="#000" />
        </linearGradient>
        <linearGradient 
          id="X" 
          x1="${Math.ceil((radius / width) * 15)}%" 
          x2="${Math.floor(100 - (radius / width) * 15)}%"
          y1="0" 
          y2="0">
            <stop offset="0%" stop-color="#F00" />
            <stop offset="100%" stop-color="#000" />
        </linearGradient>
    </defs>

    <rect x="0" y="0" height="${height}" width="${width}" fill="#808080" />
    <g filter="blur(2px)">
      <rect x="0" y="0" height="${height}" width="${width}" fill="#000080" />
      <rect
          x="0"
          y="0"
          height="${height}"
          width="${width}"
          fill="url(#Y)"
          class="mix"
      />
      <rect
          x="0"
          y="0"
          height="${height}"
          width="${width}"
          fill="url(#X)"
          class="mix"
      />
      <rect
          x="${depth}"
          y="${depth}"
          height="${height - 2 * depth}"
          width="${width - 2 * depth}"
          fill="#808080"
          rx="${radius}"
          ry="${radius}"
          filter="blur(${depth}px)"
      />
    </g>
</svg>`)

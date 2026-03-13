import { hexToRgba } from '@common/styles/utils/common'

// ---------------------------------------------------------------------------
// Specular map cache
// Key: dimensions + visual params.
// ---------------------------------------------------------------------------

const MAX_SPECULAR_CACHE = 20
const MAX_DISPLACEMENT_CACHE = 20
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
// Displacement filter data URL cache.
// Same SVG structure as the original — cached by rounded dimensions + params
// so the string is only built once per unique configuration per session.
// ---------------------------------------------------------------------------

const displacementCache = new Map<string, string>()

function buildDisplacementKey({
  width,
  height,
  radius,
  depth,
  strength = 100,
  chromaticAberration = 0
}: DisplacementOptions): string {
  return `${Math.round(width)}_${Math.round(height)}_${radius}_${depth}_${strength}_${chromaticAberration}`
}

export function getCachedDisplacementFilter(opts: DisplacementOptions): string {
  const key = buildDisplacementKey(opts)
  const cached = displacementCache.get(key)
  if (cached) return cached

  if (displacementCache.size >= MAX_DISPLACEMENT_CACHE) {
    displacementCache.delete(displacementCache.keys().next().value!)
  }

  const url = buildDisplacementFilterUrl(opts)
  displacementCache.set(key, url)
  return url
}

function buildDisplacementFilterUrl({
  height,
  width,
  radius,
  depth,
  strength = 100,
  chromaticAberration = 0
}: DisplacementOptions): string {
  const dm = getDisplacementMap({ height, width, radius, depth })
  return (
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">` +
        `<defs><filter id="displace" colorInterpolationFilters="sRGB">` +
        `<feImage x="0" y="0" height="${height}" width="${width}" href="${dm}" result="displacementMap"/>` +
        `<feDisplacementMap transformOrigin="center" in="SourceGraphic" in2="displacementMap" scale="${strength + chromaticAberration * 2}" xChannelSelector="R" yChannelSelector="G"/>` +
        `<feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="displacedR"/>` +
        `<feDisplacementMap transformOrigin="center" in="SourceGraphic" in2="displacementMap" scale="${strength + chromaticAberration}" xChannelSelector="R" yChannelSelector="G"/>` +
        `<feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="displacedG"/>` +
        `<feDisplacementMap transformOrigin="center" in="SourceGraphic" in2="displacementMap" scale="${strength}" xChannelSelector="R" yChannelSelector="G"/>` +
        `<feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="displacedB"/>` +
        `<feBlend in="displacedR" in2="displacedG" mode="screen"/>` +
        `<feBlend in2="displacedB" mode="screen"/>` +
        `</filter></defs></svg>`
    ) +
    '#displace'
  )
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
  // The comments are left on purpose so AI tools
  // can better understand the code
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

  // Precompute sin/cos of both hotspot angles so that angular distance can be
  // computed with a dot-product instead of atan2(sin(a-b), cos(a-b)) per pixel.
  // cos(pixelAngle - hotspotAngle) = cos(pixelAngle)*cos(hotspot) + sin(pixelAngle)*sin(hotspot)
  // The secondary hotspot is exactly opposite (primaryRad + π), so its
  // sin/cos are just the negations — no extra trig needed.
  const cosPrimary = Math.cos(primaryRad)
  const sinPrimary = Math.sin(primaryRad)

  // 4-supersampled-pixel fringe for smooth AA at both edges
  const eps = 4.0
  const innerLimit = -(pbw + eps)
  const strengthScale = strength * 2.5
  // Precomputed reciprocals — replaces per-pixel division with multiply
  const invPbw = 1 / pbw
  const invEps = 1 / eps

  for (let py = 0; py < ph; py++) {
    const dy = py - cy
    const absDy = Math.abs(dy)

    const qdy_outer = Math.max(absDy - hh, 0)
    const qdy2 = qdy_outer * qdy_outer // hoisted — reused for inner RSq and inlined SDF
    const outerR = pr + eps
    const outerRSq = outerR * outerR - qdy2
    if (outerRSq < 0) continue // entire row is outside the outer shell — skip
    const outerQdxMax = Math.sqrt(outerRSq)
    const xOuterMin = Math.max(0, Math.ceil(cx - hw - outerQdxMax))
    const xOuterMax = Math.min(pw - 1, Math.floor(cx + hw + outerQdxMax))

    // --- Inner bound: pixels where sdf ≥ innerLimit exist ---
    // sdf ≥ innerLimit  =>  sqrt(qdx²+qdy²) - pr ≥ innerLimit
    //                   =>  qdx² + qdy² ≥ (pr + innerLimit)²   (when pr+innerLimit > 0)
    // Inside the shape innerLimit is negative, so pr + innerLimit = pr - (pbw+eps).
    // If pr + innerLimit ≤ 0 the whole row satisfies the inner condition.
    const innerR = pr + innerLimit // pr - pbw - eps  (can be ≤ 0 for wide bezels)

    let xInnerMin = xOuterMin
    let xInnerMax = xOuterMax

    if (innerR > 0) {
      const innerRSq = innerR * innerR - qdy2
      if (innerRSq > 0) {
        // There is a "hole" in the centre: pixels with |qdx| < sqrt(innerRSq)
        // are too deep inside and will be skipped by the per-pixel check anyway.
        // We split the row into two spans: left fringe and right fringe.
        // For simplicity we keep the outer span and let the per-pixel SDF guard
        // handle the inner rejection — the expensive part (pure interior) is
        // already culled by the outer bound computed above.
        // The left-right split would save a bit more but complicates the loop;
        // the dominant saving is already achieved by the outer-bound clip.
        const innerQdxMin = Math.sqrt(innerRSq)
        xInnerMin = Math.max(xOuterMin, Math.ceil(cx - hw - innerQdxMin - 1))
        xInnerMax = Math.min(xOuterMax, Math.floor(cx + hw + innerQdxMin + 1))
        // We process two sub-spans: [xOuterMin, xInnerMin] and [xInnerMax, xOuterMax]
      }
    }

    // Precompute per-row values reused across all x iterations
    const rowBase = py * pw * 4
    const sinPixelAngleNum = dy // numerator for atan2 (denominator is dx = px-cx)

    // Process pixels in the row using two sub-spans when there is a hollow centre.
    // spans: array of [xStart, xEnd] pairs to iterate
    const spans: [number, number][] =
      innerR > 0 && xInnerMin > xOuterMin && xInnerMax < xOuterMax
        ? [
            [xOuterMin, xInnerMin],
            [xInnerMax, xOuterMax]
          ]
        : [[xOuterMin, xOuterMax]]

    for (const [xStart, xEnd] of spans) {
      for (let px = xStart; px <= xEnd; px++) {
        // Inlined sdRoundedRect — avoids a function call and reuses qdy2 from the row
        const dx = px - cx // also reused for the dot-product below
        const absDx = Math.abs(dx)
        const qdx = Math.max(absDx - hw, 0)
        const sdf = Math.sqrt(qdx * qdx + qdy2) - pr

        // Bezel band + smooth fringe on both edges
        if (sdf > eps || sdf < innerLimit) continue

        // Angular position of this rim pixel relative to the shape centre.
        // Use dot-product to compute cos(pixelAngle - hotspotAngle) directly,
        // avoiding atan2 + wrapDiff per pixel.
        // cos(pixelAngle - primaryRad) = (dx*cosPrimary + dy*sinPrimary) / dist
        // The magnitude cancels inside cos², so we work with unnormalised values
        // and normalise once with the squared distance.
        const distSq = dx * dx + sinPixelAngleNum * sinPixelAngleNum
        // Avoid division by zero at the exact centre (degenerate, never in bezel)
        if (distSq === 0) continue

        // dot = cos(pixelAngle - primaryRad) * dist  (unnormalised)
        const dotPrimary = dx * cosPrimary + sinPixelAngleNum * sinPrimary
        // Secondary is opposite: cos(pixelAngle - (primaryRad+π)) = -dotPrimary/dist
        // cos² of both distances, normalised: dot²/distSq
        const cosSqNorm = (dotPrimary * dotPrimary) / distSq // == cos²(dPrimary) == cos²(dSecondary)

        // Both hotspots share the same cos² value (they are π apart), so
        // Math.max(primary, secondary) == primary == secondary == cos² * 0.4
        const angularIntensity = cosSqNorm * 0.4

        // Radial falloff: 1 at the outer rim, 0 at the inner boundary
        const rimT = Math.max(0, -sdf) * invPbw
        // (1 - rimT)^8 via repeated squaring replaces Math.exp(-8 * rimT) —
        // same outer=1 / inner=0 qualitative shape, no transcendental call
        const t = 1 - rimT
        const t2 = t * t
        const t4 = t2 * t2
        const radialFalloff = t4 * t4

        // Smooth outer edge (sdf: +eps → 0)
        const outerAA = Math.max(0, Math.min(1, (eps - sdf) * invEps))
        // Smooth inner edge (sdf: -pbw → -(pbw+eps))
        const innerAA = Math.max(0, Math.min(1, (sdf + pbw + eps) * invEps))

        const intensity = Math.min(
          1.0,
          angularIntensity * radialFalloff * outerAA * innerAA * strengthScale
        )

        const idx = rowBase + px * 4
        data[idx] = tR
        data[idx + 1] = tG
        data[idx + 2] = tB
        data[idx + 3] = Math.round(intensity * 255)
      }
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

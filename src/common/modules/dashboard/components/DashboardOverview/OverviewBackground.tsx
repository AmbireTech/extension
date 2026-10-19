import { useCallback, useMemo, useState } from 'react'
import { LayoutChangeEvent, StyleSheet, View } from 'react-native'
import {
  Defs,
  FeBlend,
  FeColorMatrix,
  FeGaussianBlur,
  Filter,
  Image as SvgImage,
  Svg
} from 'react-native-svg'

import { isFirefoxBuild } from '@common/config/env'
import useControllerState from '@common/hooks/useControllerState'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import { getAvatarColors } from '@common/utils/avatars'

import type { OverviewCollapse } from '../DashboardPagesCarousel/DashboardPagesCarousel'
import backgroundImage from './background.png'
import OverviewBackgroundLayer, { CollapsingLayerGeometry } from './OverviewBackgroundLayer'

// The aspect ratio of `background.png`, which `slice` covers the card with
const IMAGE_ASPECT_RATIO = 456 / 226

// How far the image overhangs each side of the card, open or collapsed, so its edges never
// land on a fractional pixel inside the card and leave a hairline of black
const EDGE_BLEED = 2

type BackgroundSize = { width: number | string; height: number | string }

const FULL_SIZE: BackgroundSize = { width: '100%', height: '100%' }

// Firefox doesn't reliably repaint a percentage-sized filtered SVG image when its container
// resizes (e.g. when the sidebar is widened) - it renders it clipped first and then not at all.
// So there it's sized in pixels from the container's layout instead.
const shouldSizeInPixels = isFirefoxBuild

/** Parse a hex color to normalized [r, g, b] values (0–1) */
function hexToRgbNorm(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255
  ]
}

// How different are two colors perceptually? Returns 0 (same) to 1 (max contrast).
// Using luminance weights because our eyes are much more sensitive to green than blue.
function colorDistance(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgbNorm(hex1)
  const [r2, g2, b2] = hexToRgbNorm(hex2)
  return Math.sqrt(0.299 * (r1 - r2) ** 2 + 0.587 * (g1 - g2) ** 2 + 0.114 * (b1 - b2) ** 2)
}

// Builds a 4×5 SVG color matrix that takes one source channel (R=0, G=1, B=2)
// and outputs it as the given target color. Everything else goes black, so only
// the relevant tones in the image get recolored and the two layers don't bleed into each other.
function channelToColorMatrix(srcChannel: 0 | 1 | 2, tr: number, tg: number, tb: number): string {
  const row = (target: number) => {
    const r = [0, 0, 0, 0, 0]
    r[srcChannel] = target
    return r.join(' ')
  }
  return `${row(tr)} ${row(tg)} ${row(tb)} 0 0 0 1 0`
}

interface CardSize {
  width: number
  height: number
}

/**
 * Covers the open card with the image as `slice` does, but in a layer of the image's own
 * size, so it can then be moved as if the card got shorter by the collapse: smaller while the
 * card's height decides the cover size, and centred on what is left of the card. That is how
 * web's background used to move as its overview collapsed, by resizing the card - which
 * neither platform does anymore.
 */
const getCollapsingLayerGeometry = ({ width, height }: CardSize): CollapsingLayerGeometry => {
  // Covered as if the card were larger by the bleed on each side
  const coveredWidth = width + EDGE_BLEED * 2
  const coveredHeight = height + EDGE_BLEED * 2
  const layerWidth = Math.max(coveredWidth, coveredHeight * IMAGE_ASPECT_RATIO)
  const layerHeight = layerWidth / IMAGE_ASPECT_RATIO

  return {
    width: layerWidth,
    height: layerHeight,
    left: (width - layerWidth) / 2,
    top: (height - layerHeight) / 2,
    heightBoundCollapse: coveredHeight - coveredWidth / IMAGE_ASPECT_RATIO,
    minScale: Math.min(coveredWidth / layerWidth, 1)
  }
}

// The overview and the dashboard shell can be mounted at the same time, and a `url(#id)` reference
// resolves to the first matching id in the document - so every instance needs its own filter id.
let recolorFilterIdCounter = 0

export function OverviewBackground({
  address,
  collapse,
  blurRadius
}: {
  address: string
  /** How far the pages have slid over the card. Moves the image by transforms only. */
  collapse?: OverviewCollapse
  /** Blurs the image, for a copy of the background that stands in for a backdrop blur. */
  blurRadius?: number
}) {
  const { state } = useControllerState({ id: 'WalletStateController' })
  const [recolorFilterId] = useState(() => {
    recolorFilterIdCounter += 1
    return `overview-recolor-${recolorFilterIdCounter}`
  })
  const [cardSize, setCardSize] = useState<CardSize | null>(null)

  const onLayout = useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setCardSize((prev) =>
      prev?.width === layout.width && prev?.height === layout.height
        ? prev
        : { width: layout.width, height: layout.height }
    )
  }, [])

  const geometry = useMemo(
    () => (collapse && cardSize ? getCollapsingLayerGeometry(cardSize) : null),
    [cardSize, collapse]
  )
  // Sized in points rather than in percent: on iOS the image keeps the size a percentage
  // first resolved to when only the view around it is resized, which cut off its right side
  const fallbackSize = shouldSizeInPixels
    ? cardSize && { width: Math.round(cardSize.width), height: Math.round(cardSize.height) }
    : FULL_SIZE
  const size: BackgroundSize | null = geometry ?? fallbackSize

  const colors = getAvatarColors(state.avatarType, address)

  // Avatar colors[0] and colors[1] can sometimes be almost identical (e.g. two dark purples).
  // In that case, fall back to colors[2] as the secondary so the two layers actually look different.
  const DISTANCE_THRESHOLD = 0.2
  const d01 = colorDistance(colors[0], colors[1])
  const d02 = colorDistance(colors[0], colors[2])
  const secondary = d01 >= DISTANCE_THRESHOLD || d02 < d01 ? colors[1] : colors[2]

  const [r1, g1, b1] = hexToRgbNorm(colors[0])
  const [r2, g2, b2] = hexToRgbNorm(secondary)

  // Two matrices: one that maps the red tones in the image to the primary avatar color,
  // and one that maps the blue tones to the secondary. feBlend screen then combines them
  // so both colors show up without washing each other out.
  const matrix1 = channelToColorMatrix(0, r1, g1, b1)
  const matrix2 = channelToColorMatrix(2, r2, g2, b2)

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: '#000000',
          borderRadius: BORDER_RADIUS_PRIMARY,
          overflow: 'hidden'
        }
      ]}
      onLayout={onLayout}
    >
      <OverviewBackgroundLayer geometry={geometry} collapse={collapse}>
        {/* In Firefox nothing is rendered until the container's first layout gives it a size */}
        {!!size && (
          <Svg width={size.width} height={size.height}>
            <Defs>
              <Filter id={recolorFilterId} x="0%" y="0%" width="100%" height="100%">
                <FeColorMatrix type="matrix" values={matrix1} in="SourceGraphic" result="layer1" />
                <FeColorMatrix type="matrix" values={matrix2} in="SourceGraphic" result="layer2" />
                <FeBlend in="layer1" in2="layer2" mode="screen" />
                {!!blurRadius && <FeGaussianBlur stdDeviation={blurRadius} />}
              </Filter>
            </Defs>

            <SvgImage
              href={backgroundImage}
              width={size.width}
              height={size.height}
              preserveAspectRatio="xMidYMid slice"
              opacity={0.28}
              filter={`url(#${recolorFilterId})`}
            />
          </Svg>
        )}
      </OverviewBackgroundLayer>
    </View>
  )
}

import React, { FC, useMemo } from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'

import useTheme from '@common/hooks/useTheme'
import ThemeColors, { THEME_TYPES } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY, hexToRgba } from '@common/styles/utils/common'

import { GlassViewProps } from './GlassView'

/**
 * The web build lights its rim from two opposite corners (`generateSpecularMap` in
 * `helpers.web.ts`, `lightAngleDeg: 225` and its opposite). That map weights the rim by the cosine
 * squared of the angle to the light, so both corners come out identically bright - hence a single
 * shared opacity here rather than a primary and a secondary highlight.
 */
const HOTSPOT_CORNERS = ['0% 0%', '100% 100%']
// Fixed pixels rather than percentages, because on web the highlight lives inside a bezel of a
// fixed width however large the element gets. A percentage size smears it across the full width of
// a short, wide pill like the floating bottom bar.
const HOTSPOT_SIZE = 20

// The tint of `.liquidGlass` in `GlassView.css`.
const TINT_BASE = '#96A1B1'
const TINT_ANGLE = '135deg'
// Web stops the gradient halfway and holds `tint1` across the remaining half.
const TINT_MIDPOINT = '50%'

const BORDER_WIDTH = 1
// Keeps the crisp 1px rims to a single pixel band just inside the border.
const RIM_OFFSET = 1
// Matches `SPECULAR_BEZEL_WIDTH` on web: the glow may not reach further in than the lit rim does.
const BEZEL_GLOW_BLUR = 3

type GlassPalette = {
  /** Alpha of the frost painted underneath everything. This is what stops the bleed-through. */
  frost: number
  tint1: number
  tint2: number
  hotspot: number
  rimLight: number
  bezelGlow: number
  border: number
}

const PALETTE: GlassPalette = {
  // This frost is painted in the very colour of the page behind it, so the alpha cannot shift the
  // panel's colour - it only decides how much of the content behind stays legible through it.
  frost: 0.85,
  tint1: 0.16,
  tint2: 0.06,
  hotspot: 0.13,
  rimLight: 0.25,
  bezelGlow: 0.12,
  // Web's outermost rim pixel sits between 0.6 and 1 alpha along the edges. A hard 1px stroke has
  // none of its supersampled softening, so it has to stay below that to avoid reading as an outline.
  border: 0.4
}

/**
 * Mirrors the `strength` web feeds the specular map - 1.25 dark, 2.5 light - normalised so dark is
 * 1, because `PALETTE` holds the dark alphas. A light frost swallows a light highlight, hence the
 * lift in light mode. `hexToRgba` clamps the scaled result the same way web clamps its map at full
 * alpha.
 */
const SPECULAR_STRENGTH = {
  [THEME_TYPES.LIGHT]: 2,
  [THEME_TYPES.DARK]: 1
}

// Web drops to a strength of 1 whenever the caller brings its own `shineColor`, below even its dark
// default, because such a caller is lighting a backdrop of its own and needs no help from the theme.
const CUSTOM_SHINE_SPECULAR_STRENGTH = 0.8

/**
 * The frost stands in for the backdrop web blurs for free, so it has to guess what sits behind the
 * glass. `theme.primaryBackground` is that guess while the glass sits on the page, but a caller
 * passing its own `shineColor` is lighting the glass for a backdrop of its own - the dashboard hero
 * is painted black in both themes - so the frost stays dark there instead of following the theme.
 */
const CUSTOM_BACKDROP_FROST = {
  color: ThemeColors.primaryBackground[THEME_TYPES.DARK],
  // Deliberately below `PALETTE.frost`. This frost is lighter than the hero it covers rather than
  // the same colour, so raising it would both lighten the glass and wash out the avatar glow that
  // is meant to show through.
  alpha: 0.55
}

const buildHotspotLayer = (position: string, color: string, opacity: number) =>
  // Fades to the same RGB at zero alpha, not to `transparent`. Android interpolates gradient
  // stops in non-premultiplied sRGB, so fading to transparent black would grey out the highlight.
  `radial-gradient(${HOTSPOT_SIZE}px ${HOTSPOT_SIZE}px at ${position}, ${hexToRgba(color, opacity)} 0%, ${hexToRgba(color, 0)} 100%)`

// Mirrored pair of 1px rims, matching the two equally lit corners of the web specular map.
const buildRimLights = (color: string) =>
  [RIM_OFFSET, -RIM_OFFSET].map((offset) => ({
    offsetX: offset,
    offsetY: offset,
    color,
    inset: true
  }))

const GlassView: FC<GlassViewProps> = ({
  children,
  style,
  cssStyle,
  testID,
  tintColor1,
  borderRadius = BORDER_RADIUS_PRIMARY,
  tintColor2,
  shineColor
}) => {
  const { theme, themeType } = useTheme()

  const { pointerEvents, ...restCssStyle } = (cssStyle || {}) as any
  const mappedPointerEvents = pointerEvents === 'all' ? 'auto' : pointerEvents

  const glassStyle = useMemo(() => {
    const specularStrength = shineColor
      ? CUSTOM_SHINE_SPECULAR_STRENGTH
      : SPECULAR_STRENGTH[themeType]
    const shine = shineColor || (themeType === THEME_TYPES.LIGHT ? '#FFFFFF' : TINT_BASE)
    const tint1 = tintColor1 || hexToRgba(TINT_BASE, PALETTE.tint1)
    const tint2 = tintColor2 || hexToRgba(TINT_BASE, PALETTE.tint2)
    const specular = (alpha: number) => hexToRgba(shine, alpha * specularStrength)

    return {
      backgroundColor: shineColor
        ? hexToRgba(CUSTOM_BACKDROP_FROST.color, CUSTOM_BACKDROP_FROST.alpha)
        : hexToRgba(theme.primaryBackground, PALETTE.frost),
      // The first layer paints on top, same as CSS.
      experimental_backgroundImage: [
        ...HOTSPOT_CORNERS.map((corner) =>
          buildHotspotLayer(corner, shine, PALETTE.hotspot * specularStrength)
        ),
        `linear-gradient(${TINT_ANGLE}, ${tint2} 0%, ${tint1} ${TINT_MIDPOINT})`
      ].join(', '),
      // Inset shadows need Android 10; below that the bezel is simply skipped by the platform.
      boxShadow: [
        ...buildRimLights(specular(PALETTE.rimLight)),
        {
          offsetX: 0,
          offsetY: 0,
          blurRadius: BEZEL_GLOW_BLUR,
          color: specular(PALETTE.bezelGlow),
          inset: true
        }
      ],
      borderColor: specular(PALETTE.border),
      borderWidth: BORDER_WIDTH,
      borderRadius
    } as ViewStyle
  }, [theme.primaryBackground, themeType, tintColor1, tintColor2, shineColor, borderRadius])

  return (
    <View
      testID={testID}
      pointerEvents={mappedPointerEvents}
      style={[styles.container, glassStyle, style, restCssStyle as ViewStyle]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden'
  }
})

export default GlassView

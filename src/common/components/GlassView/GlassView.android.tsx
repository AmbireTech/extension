import React, { FC, useMemo } from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'

import useTheme from '@common/hooks/useTheme'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY, hexToRgba } from '@common/styles/utils/common'

import { GlassViewProps } from './GlassView'

/**
 * The two hotspots sit at opposite corners to mirror the specular map the web build renders
 * (see `generateSpecularMap` in `helpers.web.ts`, which lights `lightAngleDeg: 225` and its
 * opposite). Sizes are relative to the element, so they hold their shape at any dimension.
 */
const PRIMARY_HOTSPOT = { size: '112% 112%', position: '0% 0%', fade: '55%' }
const SECONDARY_HOTSPOT = { size: '100% 100%', position: '100% 100%', fade: '50%' }

// The tint of `.liquidGlass` in `GlassView.css` (#96A1B1), lifted 20% towards white. Without a
// blur to soften the backdrop the panel needs the extra lightness to read as glass rather than haze.
const TINT_BASE = '#ABB4C1'
const TINT_ANGLE = '135deg'
const TINT_MIDPOINT = '55%'

const BORDER_WIDTH = 1
// Keeps the crisp 1px rims to a single pixel band just inside the border.
const RIM_OFFSET = 1
const BEZEL_GLOW_BLUR = 14
// Pulls the glow inwards so it reads as the curved inner face of the bezel rather than a halo.
const BEZEL_GLOW_SPREAD = -6

type GlassPalette = {
  /** Alpha of `theme.primaryBackground` painted underneath everything. This is what stops the bleed-through. */
  frost: number
  tint1: number
  tint2: number
  primaryHotspot: number
  secondaryHotspot: number
  rimLight: number
  rimShadowColor: string
  bezelGlow: number
  border: number
}

const DARK_PALETTE: GlassPalette = {
  frost: 0.55,
  tint1: 0.2,
  tint2: 0.07,
  primaryHotspot: 0.16,
  secondaryHotspot: 0.06,
  rimLight: 0.2,
  rimShadowColor: hexToRgba('#000000', 0.3),
  bezelGlow: 0.12,
  border: 0.22
}

const LIGHT_PALETTE: GlassPalette = {
  frost: 0.55,
  tint1: 0.18,
  tint2: 0.06,
  // A white frost swallows a white highlight, so light mode needs a much harder specular.
  primaryHotspot: 0.5,
  secondaryHotspot: 0.22,
  rimLight: 0.7,
  rimShadowColor: hexToRgba('#101828', 0.12),
  bezelGlow: 0.35,
  border: 0.35
}

const buildHotspotLayer = (
  { size, position, fade }: typeof PRIMARY_HOTSPOT,
  color: string,
  opacity: number
) =>
  // Fades to the same RGB at zero alpha, not to `transparent`. Android interpolates gradient
  // stops in non-premultiplied sRGB, so fading to transparent black would grey out the highlight.
  `radial-gradient(${size} at ${position}, ${hexToRgba(color, opacity)} 0%, ${hexToRgba(color, 0)} ${fade})`

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
    const isLight = themeType === THEME_TYPES.LIGHT
    const palette = isLight ? LIGHT_PALETTE : DARK_PALETTE
    const shine = shineColor || (isLight ? '#FFFFFF' : TINT_BASE)
    const tint1 = tintColor1 || hexToRgba(TINT_BASE, palette.tint1)
    const tint2 = tintColor2 || hexToRgba(TINT_BASE, palette.tint2)

    return {
      backgroundColor: hexToRgba(theme.primaryBackground, palette.frost),
      // The first layer paints on top, same as CSS.
      experimental_backgroundImage: [
        buildHotspotLayer(PRIMARY_HOTSPOT, shine, palette.primaryHotspot),
        buildHotspotLayer(SECONDARY_HOTSPOT, shine, palette.secondaryHotspot),
        `linear-gradient(${TINT_ANGLE}, ${tint2} 0%, ${tint1} ${TINT_MIDPOINT})`
      ].join(', '),
      // Inset shadows need Android 10; below that the bezel is simply skipped by the platform.
      boxShadow: [
        {
          offsetX: RIM_OFFSET,
          offsetY: RIM_OFFSET,
          color: hexToRgba(shine, palette.rimLight),
          inset: true
        },
        { offsetX: -RIM_OFFSET, offsetY: -RIM_OFFSET, color: palette.rimShadowColor, inset: true },
        {
          offsetX: 0,
          offsetY: 0,
          blurRadius: BEZEL_GLOW_BLUR,
          spreadDistance: BEZEL_GLOW_SPREAD,
          color: hexToRgba(shine, palette.bezelGlow),
          inset: true
        }
      ],
      borderColor: hexToRgba(shine, palette.border),
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

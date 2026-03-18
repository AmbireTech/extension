import './GlassView.css'

import React, { useLayoutEffect, useMemo, useRef } from 'react'
import { ViewProps } from 'react-native'

import useTheme from '@common/hooks/useTheme'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY, hexToRgba } from '@common/styles/utils/common'
import { engine } from '@web/constants/browserapi'

import { GlassViewProps } from './GlassView'
import {
  generateSpecularMap,
  getCachedDisplacementFilter,
  getCachedSpecularMap,
  setCachedSpecularMap
} from './helpers.web'

const GlassView: React.FC<GlassViewProps & ViewProps> = ({
  children,
  cssStyle,
  testID,
  tintColor1,
  tintColor2,
  shineColor,
  borderRadius = BORDER_RADIUS_PRIMARY,
  blurAmount = 4,
  isSimpleBlur = true
}) => {
  const { themeType } = useTheme()
  const divRef = useRef<HTMLDivElement>(null)
  // Lets us update the background and backdrop-filter
  // in the layout effect without triggering a React re-render on every resize.
  const specularRef = useRef<HTMLDivElement>(null)

  const shineBase = shineColor || (themeType === THEME_TYPES.LIGHT ? '#ffffff' : '#96A1B1')

  const customProperties = useMemo(
    () =>
      ({
        '--glass-tint-color-1': tintColor1 || hexToRgba('#96A1B1', 0.16),
        '--glass-tint-color-2': tintColor2 || hexToRgba('#96A1B1', 0.06),
        '--glass-blur-amount': `${blurAmount}px`,
        fontSize: `${borderRadius}px`,
        borderRadius,
        ...cssStyle
      }) as React.CSSProperties,
    [tintColor1, tintColor2, blurAmount, borderRadius, cssStyle]
  )

  useLayoutEffect(() => {
    const el = divRef.current
    if (!el) return

    const buildSpecularOpts = (w: number, h: number) => ({
      width: w,
      height: h,
      radius: borderRadius,
      bezelWidth: 7,
      lightAngleDeg: 225,
      strength: shineColor ? 1 : themeType === THEME_TYPES.DARK ? 1.25 : 2.5,
      tintHex: shineBase
    })

    // Compute and apply backdropFilter directly — no setState, no re-render.
    // blurAmount is in the deps array so this re-runs whenever it changes.
    const applyBackdropFilter = (displacementUrl: string | null) => {
      let filter: string
      if (engine !== 'webkit' || isSimpleBlur || !displacementUrl) {
        filter = `blur(${blurAmount}px)`
      } else {
        const brightness = themeType === THEME_TYPES.DARK ? 1.1 : 1
        const saturate = themeType === THEME_TYPES.DARK ? 1.5 : 1
        filter = `blur(${blurAmount / 2}px) url('${displacementUrl}') blur(${blurAmount}px) brightness(${brightness}) saturate(${saturate})`
      }
      el.style.backdropFilter = filter
    }

    const computeDisplacementUrl = (w: number, h: number): string | null => {
      if (engine !== 'webkit' || isSimpleBlur) return null
      return getCachedDisplacementFilter({
        width: w,
        height: h,
        radius: borderRadius,
        depth: 2,
        strength: themeType === THEME_TYPES.DARK ? 100 : 25,
        chromaticAberration: 3
      })
    }

    // Set the specular background directly on the overlay div — no setState, no re-render.
    const applySpecular = (w: number, h: number) => {
      const opts = buildSpecularOpts(w, h)
      const cached = getCachedSpecularMap(opts)
      const dataUrl = cached ?? generateSpecularMap(opts)
      if (!cached) setCachedSpecularMap(opts, dataUrl)
      if (specularRef.current) specularRef.current.style.backgroundImage = `url(${dataUrl})`
    }

    // Apply immediately for the current size (runs before first paint).
    const w0 = el.offsetWidth
    const h0 = el.offsetHeight
    if (w0 && h0) {
      applySpecular(w0, h0)
      applyBackdropFilter(computeDisplacementUrl(w0, h0))
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      if (width && height) {
        applySpecular(width, height)
        applyBackdropFilter(computeDisplacementUrl(width, height))
      }
    })
    observer.observe(el)

    return () => {
      observer.disconnect()
    }
  }, [borderRadius, themeType, shineBase, shineColor, isSimpleBlur, blurAmount])

  return (
    <div ref={divRef} className="liquidGlass" style={customProperties} data-testid={testID}>
      {children}
      <div ref={specularRef} className="specular-shine" />
    </div>
  )
}

export default GlassView

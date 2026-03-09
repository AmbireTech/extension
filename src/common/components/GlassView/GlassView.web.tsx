import './GlassView.css'

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ViewProps } from 'react-native'

import useTheme from '@common/hooks/useTheme'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY, hexToRgba } from '@common/styles/utils/common'
import { engine } from '@web/constants/browserapi'

import { GlassViewProps } from './GlassView'
import {
  buildFilterId,
  generateSpecularMap,
  getCachedSpecularMap,
  getOrInjectDisplacementFilter,
  releaseDisplacementFilter,
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
  isSimpleBlur = false
}) => {
  const { themeType } = useTheme()
  const divRef = useRef<HTMLDivElement>(null)
  const [specularDataUrl, setSpecularDataUrl] = useState<string | null>(null)
  const [filterId, setFilterId] = useState<string | null>(null)
  const filterIdRef = useRef<string | null>(null)

  const shineBase = shineColor || (themeType === THEME_TYPES.LIGHT ? '#ffffff' : '#96A1B1')

  // Release the filter on unmount.
  useEffect(
    () => () => {
      if (filterIdRef.current) releaseDisplacementFilter(filterIdRef.current)
    },
    []
  )

  const backdropFilter = useMemo(() => {
    if (engine !== 'webkit' || isSimpleBlur || !filterId) return `blur(${blurAmount}px)`
    const brightness = themeType === THEME_TYPES.DARK ? 1.1 : 1
    const saturate = themeType === THEME_TYPES.DARK ? 1.5 : 1
    return `blur(${blurAmount / 2}px) url(#${filterId}) blur(${blurAmount}px) brightness(${brightness}) saturate(${saturate})`
  }, [blurAmount, filterId, isSimpleBlur, themeType])

  const customProperties = useMemo(
    () =>
      ({
        '--glass-tint-color-1': tintColor1 || hexToRgba('#96A1B1', 0.16),
        '--glass-tint-color-2': tintColor2 || hexToRgba('#96A1B1', 0.06),
        '--glass-blur-amount': `${blurAmount}px`,
        fontSize: `${borderRadius}px`,
        borderRadius,
        backdropFilter,
        ...cssStyle
      }) as React.CSSProperties,
    [tintColor1, tintColor2, blurAmount, borderRadius, backdropFilter, cssStyle]
  )

  useLayoutEffect(() => {
    const el = divRef.current
    if (!el) return

    let idleHandle: ReturnType<typeof requestIdleCallback> | null = null
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null
    let cancelled = false

    const buildSpecularOpts = (w: number, h: number) => ({
      width: w,
      height: h,
      radius: borderRadius,
      bezelWidth: 7,
      lightAngleDeg: 225,
      strength: shineColor ? 1 : themeType === THEME_TYPES.DARK ? 1.25 : 2.5,
      tintHex: shineBase
    })

    const buildDisplaceOpts = (w: number, h: number) => ({
      width: w,
      height: h,
      radius: borderRadius,
      depth: 2,
      strength: themeType === THEME_TYPES.DARK ? 100 : 25,
      chromaticAberration: 3
    })

    // Inject (or reuse) a correctly-sized filter. Cheap: Map lookup or one DOM mutation.
    const updateFilter = (w: number, h: number) => {
      if (engine !== 'webkit' || isSimpleBlur) {
        if (filterIdRef.current) {
          releaseDisplacementFilter(filterIdRef.current)
          filterIdRef.current = null
          setFilterId(null)
        }
        return
      }
      const opts = buildDisplaceOpts(w, h)
      const newId = buildFilterId(opts)
      if (newId !== filterIdRef.current) {
        if (filterIdRef.current) releaseDisplacementFilter(filterIdRef.current)
        getOrInjectDisplacementFilter(opts)
        filterIdRef.current = newId
        setFilterId(newId)
      }
    }

    // Phase 1 — synchronous so specular and filter are present in the same
    // painted frame as the element.
    const w0 = el.offsetWidth
    const h0 = el.offsetHeight
    if (w0 && h0) {
      const opts0 = buildSpecularOpts(w0, h0)
      const cached0 = getCachedSpecularMap(opts0)
      if (cached0) {
        setSpecularDataUrl(cached0)
      } else {
        const dataUrl = generateSpecularMap(opts0)
        setCachedSpecularMap(opts0, dataUrl)
        setSpecularDataUrl(dataUrl)
      }
      updateFilter(w0, h0)
    }

    // Phase 2 — deferred on resize since the specular is already visible.
    // Filter update is synchronous since it's cheap (Map lookup or DOM node).
    const scheduleResize = (w: number, h: number) => {
      if (idleHandle !== null) cancelIdleCallback(idleHandle)
      if (timeoutHandle !== null) clearTimeout(timeoutHandle)

      updateFilter(w, h)

      const opts = buildSpecularOpts(w, h)
      const cached = getCachedSpecularMap(opts)
      if (cached) {
        setSpecularDataUrl(cached)
        return
      }

      const run = () => {
        if (cancelled) return
        const dataUrl = generateSpecularMap(opts)
        setCachedSpecularMap(opts, dataUrl)
        setSpecularDataUrl(dataUrl)
      }

      if (typeof requestIdleCallback !== 'undefined') {
        idleHandle = requestIdleCallback(run, { timeout: 500 })
      } else {
        timeoutHandle = setTimeout(run, 0)
      }
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      if (width && height) scheduleResize(width, height)
    })
    observer.observe(el)

    return () => {
      cancelled = true
      observer.disconnect()
      if (idleHandle !== null) cancelIdleCallback(idleHandle)
      if (timeoutHandle !== null) clearTimeout(timeoutHandle)
    }
  }, [borderRadius, themeType, shineBase, shineColor, isSimpleBlur])

  return (
    <div ref={divRef} className="liquidGlass" style={customProperties} data-testid={testID}>
      {children}
      {specularDataUrl && (
        <div className="specular-shine" style={{ backgroundImage: `url(${specularDataUrl})` }} />
      )}
    </div>
  )
}

export default GlassView

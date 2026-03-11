import './GlassView.css'

import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
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
  return (
    <div className="liquidGlass" data-testid={testID}>
      {children}
    </div>
  )
  const { themeType } = useTheme()
  const divRef = useRef<HTMLDivElement>(null)
  const [specularDataUrl, setSpecularDataUrl] = useState<string | null>(null)
  const [displacementDataUrl, setDisplacementDataUrl] = useState<string | null>(null)

  const shineBase = shineColor || (themeType === THEME_TYPES.LIGHT ? '#ffffff' : '#96A1B1')

  const backdropFilter = useMemo(() => {
    if (engine !== 'webkit' || isSimpleBlur || !displacementDataUrl) return `blur(${blurAmount}px)`
    const brightness = themeType === THEME_TYPES.DARK ? 1.1 : 1
    const saturate = themeType === THEME_TYPES.DARK ? 1.5 : 1
    return `blur(${blurAmount / 2}px) url('${displacementDataUrl}') blur(${blurAmount}px) brightness(${brightness}) saturate(${saturate})`
  }, [blurAmount, displacementDataUrl, isSimpleBlur, themeType])

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

    const updateDisplacement = (w: number, h: number) => {
      if (engine !== 'webkit' || isSimpleBlur) {
        setDisplacementDataUrl(null)
        return
      }
      setDisplacementDataUrl(getCachedDisplacementFilter(buildDisplaceOpts(w, h)))
    }

    // Calculate or get cached first
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
      updateDisplacement(w0, h0)
    }

    const scheduleResize = (w: number, h: number) => {
      updateDisplacement(w, h)

      const opts = buildSpecularOpts(w, h)
      const cached = getCachedSpecularMap(opts)
      if (cached) {
        setSpecularDataUrl(cached)
        return
      }

      const dataUrl = generateSpecularMap(opts)
      setCachedSpecularMap(opts, dataUrl)
      setSpecularDataUrl(dataUrl)
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      if (width && height) scheduleResize(width, height)
    })
    observer.observe(el)

    return () => {
      observer.disconnect()
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

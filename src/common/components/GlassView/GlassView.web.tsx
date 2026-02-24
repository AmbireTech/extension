import './GlassView.css'

import React, { useEffect, useRef, useState } from 'react'
import { ViewProps } from 'react-native'

import useTheme from '@common/hooks/useTheme'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY, hexToRgba } from '@common/styles/utils/common'
import { engine } from '@web/constants/browserapi'

import { generateSpecularMap, getDisplacementFilter } from './helpers.web'
import { GlassViewProps } from './types'

const GlassView: React.FC<GlassViewProps & ViewProps> = ({
  children,
  cssStyle,
  testID,
  tintColor1,
  tintColor2,
  shineColor,
  borderRadius = BORDER_RADIUS_PRIMARY,
  blurAmount = 4
}) => {
  const { themeType } = useTheme()
  const divRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [specularDataUrl, setSpecularDataUrl] = useState<string | null>(null)

  // Tint colour for the specular highlight.
  // Light mode → pure white; dark mode → near-white with a slight cool tint.
  const shineBase = shineColor || (themeType === THEME_TYPES.LIGHT ? '#ffffff' : '#96A1B129')

  const customProperties = {
    '--glass-tint-color-1': tintColor1 || hexToRgba('#96A1B1', 0.16),
    '--glass-tint-color-2': tintColor2 || hexToRgba('#96A1B1', 0.06),
    '--glass-blur-amount': `${blurAmount}px`,
    fontSize: `${borderRadius}px`,
    borderRadius,
    // SVG blurs are supported only in Webkit browsers
    backdropFilter:
      engine !== 'webkit'
        ? `blur(${blurAmount}px)`
        : `blur(${blurAmount / 2}px) url('${getDisplacementFilter({
            height: size.height || 100,
            width: size.width || 100,
            radius: borderRadius,
            depth: 2,
            strength: themeType === THEME_TYPES.DARK ? 100 : 25,
            chromaticAberration: 3
          })}') blur(${blurAmount}px) brightness(${themeType === THEME_TYPES.DARK ? 1.1 : 1}) saturate(${themeType === THEME_TYPES.DARK ? 1.5 : 1})`,
    ...cssStyle
  } as React.CSSProperties

  useEffect(() => {
    const el = divRef.current
    if (!el) return

    const updateSize = () => {
      setSize({
        width: el.offsetWidth,
        height: el.offsetHeight
      })
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Re-generate the physics-based specular map whenever the element size,
  // border-radius, or theme changes.  The canvas pixel-loop is the same
  // SDF-gradient + dot-product technique described at kube.io/blog/liquid-glass-css-svg/.
  useEffect(() => {
    if (!size.width || !size.height) return

    const dataUrl = generateSpecularMap({
      width: size.width,
      height: size.height,
      radius: borderRadius,
      bezelWidth: 7,
      lightAngleDeg: 225,
      strength: themeType === THEME_TYPES.DARK || shineBase ? 1 : 2,
      tintHex: shineBase
    })
    setSpecularDataUrl(dataUrl)
  }, [size.width, size.height, borderRadius, themeType, shineBase])

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

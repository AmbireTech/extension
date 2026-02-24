import './GlassView.css'

import React, { useLayoutEffect, useRef, useState } from 'react'
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
  const [specularDataUrl, setSpecularDataUrl] = useState<string | null>(null)

  // Tint colour for the specular highlight.
  // Light mode → pure white; dark mode → near-white with a slight cool tint.
  const shineBase = shineColor || (themeType === THEME_TYPES.LIGHT ? '#ffffff' : '#96A1B1')

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
            height: divRef.current?.offsetHeight || 100,
            width: divRef.current?.offsetWidth || 100,
            radius: borderRadius,
            depth: 2,
            strength: themeType === THEME_TYPES.DARK ? 100 : 25,
            chromaticAberration: 3
          })}') blur(${blurAmount}px) brightness(${themeType === THEME_TYPES.DARK ? 1.1 : 1}) saturate(${themeType === THEME_TYPES.DARK ? 1.5 : 1})`,
    ...cssStyle
  } as React.CSSProperties

  // useLayoutEffect so it's computed immediately
  useLayoutEffect(() => {
    const el = divRef.current
    if (!el) return

    const generate = () => {
      const w = el.offsetWidth
      const h = el.offsetHeight
      if (!w || !h) return
      setSpecularDataUrl(
        generateSpecularMap({
          width: w,
          height: h,
          radius: borderRadius,
          bezelWidth: 7,
          lightAngleDeg: 225,
          strength: shineColor ? 1 : themeType === THEME_TYPES.DARK ? 1.25 : 2.5,
          tintHex: shineBase
        })
      )
    }

    generate()
    window.addEventListener('resize', generate)
    return () => window.removeEventListener('resize', generate)
  }, [borderRadius, themeType, shineBase, shineColor])

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

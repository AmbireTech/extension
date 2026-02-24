import './GlassView.css'

import React, { useEffect, useRef, useState } from 'react'
import { ViewProps } from 'react-native'

import useTheme from '@common/hooks/useTheme'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY, hexToRgba } from '@common/styles/utils/common'

import { getDisplacementFilter } from './helpers.web'
import { GlassViewProps } from './types'

const getShineColors = (shineBase: string): [string, string, string] => {
  return [hexToRgba(shineBase, 0.8), hexToRgba(shineBase, 0.2), hexToRgba(shineBase, 0)]
}

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
  const shineBase = shineColor || (themeType === THEME_TYPES.LIGHT ? '#ffffff' : '#cccccc')
  const shineColors = getShineColors(shineBase)

  const customProperties = {
    '--glass-tint-color-1': tintColor1 || hexToRgba('#96A1B1', 0.16),
    '--glass-tint-color-2': tintColor2 || hexToRgba('#96A1B1', 0.06),
    '--glass-shine-color-1': shineColors[0],
    '--glass-shine-color-2': shineColors[1],
    '--glass-shine-color-3': shineColors[2],
    '--glass-blur-amount': `${blurAmount}px`,
    '--glass-shine-width': `${themeType === THEME_TYPES.DARK || shineColor ? 1 : 1.75}px`,
    fontSize: `${borderRadius}px`,
    borderRadius,
    backdropFilter: `blur(${blurAmount / 2}px) url('${getDisplacementFilter({
      height: size.height || 100,
      width: size.width || 100,
      radius: borderRadius,
      depth: 2,
      strength: themeType === THEME_TYPES.DARK ? 100 : 25,
      chromaticAberration: 4
    })}') blur(${blurAmount}px) brightness(${themeType === THEME_TYPES.DARK ? 1.1 : 1}) saturate(${themeType === THEME_TYPES.DARK ? 1.5 : 1}) `,
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

  return (
    <div ref={divRef} className="liquidGlass" style={customProperties} data-testid={testID}>
      {children}
      <div className="shine-container">
        <div className="shine">
          <div className="shine-top-left" />
          <div className="shine-bottom-right" />
        </div>
      </div>
    </div>
  )
}

export default GlassView

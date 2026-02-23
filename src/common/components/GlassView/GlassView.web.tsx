import './GlassView.css'

import React, { useCallback, useRef } from 'react'
import { ViewProps } from 'react-native'

import useTheme from '@common/hooks/useTheme'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { hexToRgba } from '@common/styles/utils/common'

import { GlassViewProps } from './types'

const GlassView: React.FC<GlassViewProps & ViewProps> = ({
  children,
  cssStyle,
  testID,
  tintColor1,
  tintColor2,
  shineColor,
  blurAmount = 4,
  withCursorShine = true
}) => {
  const { themeType } = useTheme()
  const divRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = divRef.current
      if (!el || !withCursorShine) return
      const rect = el.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      const radius = Math.min(Math.max(rect.width, rect.height) * 0.6, 200)
      el.style.setProperty('--mouse-x', `${x}%`)
      el.style.setProperty('--mouse-y', `${y}%`)
      el.style.setProperty('--shine-radius', `${radius}px`)
      el.style.setProperty('--shine-opacity', '1')
    },
    [withCursorShine]
  )

  const handleMouseLeave = useCallback(() => {
    const el = divRef.current
    if (!el || !withCursorShine) return
    el.style.setProperty('--shine-opacity', '0')
  }, [withCursorShine])

  const customProperties = {
    '--glass-tint-color-1': tintColor1 || hexToRgba('#D1D1D1', 0.16),
    '--glass-tint-color-2': tintColor2 || hexToRgba('#D1D1D1', 0.06),
    '--glass-shine-color':
      shineColor || (themeType === THEME_TYPES.LIGHT ? '#fff' : hexToRgba('#FFFFFF', 0.2)),
    '--glass-cursor-shine-color':
      themeType === THEME_TYPES.LIGHT ? '#fff' : hexToRgba('#FFFFFF', 0.1),
    '--glass-blur-amount': `${blurAmount}px`,
    ...cssStyle
  } as React.CSSProperties

  return (
    <div
      ref={divRef}
      className="liquidGlass"
      style={customProperties}
      data-testid={testID}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <div className="shine" />
    </div>
  )
}

export default GlassView

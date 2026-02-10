import './GlassView.css'

import React from 'react'
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
  blurAmount = 4
}) => {
  const { theme, themeType } = useTheme()

  const customProperties = {
    '--glass-tint-color-1': tintColor1 || hexToRgba('#D1D1D1', 0.16),
    '--glass-tint-color-2': tintColor2 || hexToRgba('#D1D1D1', 0.06),
    '--glass-shine-color':
      shineColor || (themeType === THEME_TYPES.LIGHT ? '#fff' : hexToRgba('#FFFFFF', 0.2)),
    '--glass-blur-amount': `${blurAmount}px`,
    ...cssStyle
  } as React.CSSProperties

  return (
    <div className="liquidGlass" style={customProperties} data-testID={testID}>
      {children}
    </div>
  )
}

export default GlassView

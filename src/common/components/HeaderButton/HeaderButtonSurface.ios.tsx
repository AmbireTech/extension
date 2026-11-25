import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect'
import React, { FC } from 'react'
import { View } from 'react-native'

import useTheme from '@common/hooks/useTheme'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

import { HEADER_BUTTON_SIZE } from './constants'
import SolidSurface from './HeaderButtonSurface'

type Props = { children: React.ReactNode }

// A runtime constant: Liquid Glass exists from iOS 26 on
const liquidGlassAvailable = isLiquidGlassAvailable()

// The glass draws its rim and shadow past the circle, and a sheet's scroll view clips
// whatever reaches its edges, so the circle keeps this much room around it
const GLASS_OUTSET = 1
const GLASS_ROOM_STYLE = { padding: GLASS_OUTSET }

const GLASS_STYLE = [
  flexbox.center,
  {
    width: HEADER_BUTTON_SIZE,
    height: HEADER_BUTTON_SIZE,
    borderRadius: HEADER_BUTTON_SIZE / 2
  }
]

/**
 * The Liquid Glass circle of the system's sheet buttons, in the app's theme rather than the
 * system's. Older iOS, which has no Liquid Glass, gets the solid circle.
 */
const HeaderButtonSurface: FC<Props> = ({ children }) => {
  const { themeType } = useTheme()

  if (!liquidGlassAvailable) return <SolidSurface>{children}</SolidSurface>

  return (
    <View style={GLASS_ROOM_STYLE}>
      <GlassView
        glassEffectStyle="regular"
        isInteractive
        colorScheme={themeType === THEME_TYPES.DARK ? 'dark' : 'light'}
        style={GLASS_STYLE}
      >
        {children}
      </GlassView>
    </View>
  )
}

export default React.memo(HeaderButtonSurface)

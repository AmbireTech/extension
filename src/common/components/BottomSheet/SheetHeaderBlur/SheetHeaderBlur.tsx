import { BlurView } from 'expo-blur'
import React from 'react'
import { StyleSheet } from 'react-native'

import useTheme from '@common/hooks/useTheme'
import { THEME_TYPES } from '@common/styles/themeConfig'

const BLUR_INTENSITY = 90

/**
 * The frosted glass behind a floating sheet header and the section headers pinned below it,
 * filling its parent and blurring what scrolls under it.
 */
const SheetHeaderBlur = () => {
  const { themeType } = useTheme()

  return (
    <BlurView
      intensity={BLUR_INTENSITY}
      tint={themeType === THEME_TYPES.DARK ? 'dark' : 'light'}
      style={StyleSheet.absoluteFill}
    />
  )
}

export default React.memo(SheetHeaderBlur)

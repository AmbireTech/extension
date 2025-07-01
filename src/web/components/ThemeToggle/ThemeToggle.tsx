import React, { useCallback } from 'react'
import { View } from 'react-native'

import DarkModeIcon from '@common/assets/svg/DarkModeIcon'
import LightModeIcon from '@common/assets/svg/LightModeIcon'
import FatToggle from '@common/components/FatToggle'
import Toggle from '@common/components/Toggle'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import useBackgroundService from '@web/hooks/useBackgroundService'

const ThemeToggle = () => {
  const { theme, themeType } = useTheme()
  const { dispatch } = useBackgroundService()

  const handleSetTheme = useCallback(() => {
    dispatch({
      type: 'SET_THEME_TYPE',
      params: { themeType: themeType === THEME_TYPES.DARK ? THEME_TYPES.LIGHT : THEME_TYPES.DARK }
    })
  }, [dispatch, themeType])

  return (
    <FatToggle
      trackStyle={{
        backgroundColor: themeType === THEME_TYPES.DARK ? '#FFFFFF14' : '#14183314'
      }}
      toggleStyle={{
        backgroundColor:
          themeType === THEME_TYPES.DARK ? theme.tertiaryBackground : theme.primaryBackground
      }}
      isOn={themeType === THEME_TYPES.DARK}
      onToggle={handleSetTheme}
    >
      <View
        style={{
          width: 52,
          height: 28,
          ...spacings.phMi,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: themeType === THEME_TYPES.DARK ? 'flex-start' : 'flex-end'
        }}
      >
        {themeType === THEME_TYPES.DARK ? <LightModeIcon /> : <DarkModeIcon />}
      </View>
    </FatToggle>
  )
}

export default React.memo(ThemeToggle)

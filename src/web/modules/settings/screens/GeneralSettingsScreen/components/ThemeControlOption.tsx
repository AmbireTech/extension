import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import DarkThemeIcon from '@common/assets/svg/DarkThemeIcon'
import LightThemeIcon from '@common/assets/svg/LightThemeIcon'
import SystemThemeIcon from '@common/assets/svg/SystemThemeIcon'
import ControlOption from '@common/components/ControlOption'
import Select from '@common/components/Select'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES, ThemeType } from '@common/styles/themeConfig'
import useBackgroundService from '@web/hooks/useBackgroundService'

const ThemeControlOption = () => {
  const { t } = useTranslation()
  const { selectedThemeType, theme } = useTheme()
  const { dispatch } = useBackgroundService()

  const THEME_SELECT_OPTIONS = useMemo(
    () => [
      {
        value: THEME_TYPES.LIGHT,
        label: t('Light')
      },
      {
        value: THEME_TYPES.DARK,
        label: t('Dark')
      },
      {
        value: THEME_TYPES.SYSTEM,
        label: t('System')
      }
    ],
    [t]
  )

  const selectedOption = useMemo(
    () =>
      THEME_SELECT_OPTIONS.find((opt) => opt.value === selectedThemeType) ||
      THEME_SELECT_OPTIONS[0],
    [THEME_SELECT_OPTIONS, selectedThemeType]
  )

  return (
    <ControlOption
      title={t('Theme mode')}
      description={t('Choose between light, dark or system mode.')}
      style={spacings.mbTy}
      renderIcon={
        selectedThemeType === THEME_TYPES.SYSTEM ? (
          <SystemThemeIcon color={theme.primaryText} />
        ) : selectedThemeType === THEME_TYPES.DARK ? (
          <DarkThemeIcon color={theme.primaryText} />
        ) : (
          <LightThemeIcon color={theme.primaryText} />
        )
      }
    >
      <Select
        setValue={(option) => {
          dispatch({ type: 'SET_THEME_TYPE', params: { themeType: option.value as ThemeType } })
        }}
        withSearch={false}
        options={THEME_SELECT_OPTIONS}
        value={selectedOption}
        containerStyle={{ width: 120, ...spacings.mb0 }}
        size="sm"
      />
    </ControlOption>
  )
}

export default React.memo(ThemeControlOption)

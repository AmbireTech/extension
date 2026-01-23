import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import DarkThemeIcon from '@common/assets/svg/DarkThemeIcon'
import LightThemeIcon from '@common/assets/svg/LightThemeIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import SystemThemeIcon from '@common/assets/svg/SystemThemeIcon'
import ControlOption from '@common/components/ControlOption'
import Select from '@common/components/Select'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES, ThemeType } from '@common/styles/themeConfig'
import { AvatarType } from '@web/extension-services/background/controllers/wallet-state'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useWalletStateController from '@web/hooks/useWalletStateController'

const AvatarTypeControlOption = () => {
  const { t } = useTranslation()
  const { avatarType } = useWalletStateController()
  const { dispatch } = useBackgroundService()

  const AVATAR_TYPE_OPTIONS = useMemo(
    () => [
      {
        value: 'jazzicon',
        label: t('Jazzicon')
      },
      {
        value: 'blockies',
        label: t('Blockies')
      },
      {
        value: 'polyicons',
        label: t('Polyicons')
      }
    ],
    [t]
  )

  const selectedOption = useMemo(
    () => AVATAR_TYPE_OPTIONS.find((opt) => opt.value === avatarType) || AVATAR_TYPE_OPTIONS[0],
    [AVATAR_TYPE_OPTIONS, avatarType]
  )

  return (
    <ControlOption
      title={t('Avatar type')}
      description={t('Choose between different avatar styles.')}
      renderIcon={<SettingsIcon />}
    >
      <Select
        setValue={(option) => {
          dispatch({ type: 'SET_AVATAR_TYPE', params: { avatarType: option.value as AvatarType } })
        }}
        withSearch={false}
        options={AVATAR_TYPE_OPTIONS}
        value={selectedOption}
        containerStyle={{ width: 120, ...spacings.mb0 }}
        size="sm"
      />
    </ControlOption>
  )
}

export default React.memo(AvatarTypeControlOption)

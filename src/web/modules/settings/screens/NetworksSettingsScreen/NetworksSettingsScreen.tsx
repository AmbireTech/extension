import React from 'react'

import NetworkSettings from '@web/modules/network-settings/components'
import { useTranslation } from 'react-i18next'
import SettingsPageHeader from '../../components/SettingsPageHeader'

const NetworksSettingsScreen = () => {
  const { t } = useTranslation()

  return (
    <>
      <SettingsPageHeader title={t('Networks')} />
      <NetworkSettings />
    </>
  )
}

export default React.memo(NetworksSettingsScreen)

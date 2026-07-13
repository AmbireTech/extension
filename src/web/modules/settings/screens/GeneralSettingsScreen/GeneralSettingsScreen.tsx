import React, { useContext, useEffect } from 'react'
import { View } from 'react-native'

import AvatarTypeControlOption from '@common/modules/settings/components/General/AvatarTypeControlOption'
import LogLevelControlOption from '@common/modules/settings/components/General/LogLevelControlOption'
import ThemeControlOption from '@common/modules/settings/components/General/ThemeControlOption'
// import { isProd } from '@common/config/env'
import spacings from '@common/styles/spacings'
import AutoLockDeviceControlOption from '@web/modules/settings/components/General/AutoLockDeviceControlOption'
import BiometricsOption from '@web/modules/settings/components/General/BiometricsOption'
import LockAmbireControlOption from '@web/modules/settings/components/General/LockAmbireControlOption'
import SettingsPageHeader from '@web/modules/settings/components/SettingsPageHeader'
import { SettingsRoutesContext } from '@web/modules/settings/contexts/SettingsRoutesContext'

const GeneralSettingsScreen = () => {
  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)

  useEffect(() => {
    setCurrentSettingsPage('general')
  }, [setCurrentSettingsPage])

  return (
    <>
      <SettingsPageHeader title="General settings" />
      <View style={spacings.mb2Xl}>
        <LockAmbireControlOption />
        <BiometricsOption />
        <AutoLockDeviceControlOption />
        <ThemeControlOption />
        <AvatarTypeControlOption />
      </View>
      <SettingsPageHeader title="Support tools" />
      <LogLevelControlOption />
    </>
  )
}

export default GeneralSettingsScreen

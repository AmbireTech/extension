import React, { useContext, useEffect } from 'react'
import { View } from 'react-native'

import { CRASH_ANALYTICS_ENABLED_DEFAULT } from '@common/config/analytics/CrashAnalytics.web'
import { isDev } from '@common/config/env'
import AvatarTypeControlOption from '@common/modules/settings/components/General/AvatarTypeControlOption'
import CrashAnalyticsControlOption from '@common/modules/settings/components/General/CrashAnalyticsControlOption'
import LogLevelControlOption from '@common/modules/settings/components/General/LogLevelControlOption'
import ThemeControlOption from '@common/modules/settings/components/General/ThemeControlOption'
// import { isProd } from '@common/config/env'
import spacings from '@common/styles/spacings'
import AutoLockDeviceControlOption from '@web/modules/settings/components/General/AutoLockDeviceControlOption'
// import CrashAnalyticsControlOption from './components/CrashAnalyticsControlOption'
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
        <AutoLockDeviceControlOption />
        <ThemeControlOption />
        <AvatarTypeControlOption />
      </View>
      <SettingsPageHeader title="Support tools" />
      <LogLevelControlOption />
      {/* As of v5.21.2, display this only when crash analytics are disabled by default. */}
      {!isDev && !CRASH_ANALYTICS_ENABLED_DEFAULT && <CrashAnalyticsControlOption />}
    </>
  )
}

export default GeneralSettingsScreen

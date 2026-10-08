import '@common/config/localization'

import * as SplashScreen from 'expo-splash-screen'
import React, { useEffect } from 'react'
import { useStallionUpdate, withStallion } from 'react-native-stallion'

import { captureException, setTagContext } from '@common/config/analytics/CrashAnalytics'
import { OTA_VERSION_DEFAULT, OTA_VERSION_TAG } from '@common/constants/crashAnalytics'
import AppInit from '@common/modules/app-init/screens/AppInit'
import { BOOT_MARK, markBoot, markBootOnce } from '@mobile/services/bootProfiler'

SplashScreen.preventAutoHideAsync().catch(captureException)

// index.js imports this module last, so reaching here means every shim, polyfill,
// Sentry init and localization bundle in the entry graph has been evaluated.
markBoot(BOOT_MARK.rnEntryModuleEvaluated)

const App = () => {
  markBootOnce(BOOT_MARK.rnAppRender)
  const { currentlyRunningBundle } = useStallionUpdate()

  useEffect(() => {
    setTagContext(OTA_VERSION_TAG, String(currentlyRunningBundle?.version ?? OTA_VERSION_DEFAULT))
  }, [currentlyRunningBundle?.version])

  return <AppInit />
}

export default withStallion(App)

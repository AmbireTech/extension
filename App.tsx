import '@common/config/localization'

import * as SplashScreen from 'expo-splash-screen'
import React, { useEffect } from 'react'
import { useStallionUpdate, withStallion } from 'react-native-stallion'

import { captureException, setTagContext } from '@common/config/analytics/CrashAnalytics'
import { OTA_VERSION_TAG, OTA_VERSION_UNKNOWN } from '@common/constants/crashAnalytics'
import AppInit from '@common/modules/app-init/screens/AppInit'
import { BOOT_MARK, markBoot, markBootOnce } from '@mobile/services/bootProfiler'

SplashScreen.preventAutoHideAsync().catch((error) => {
  console.error('Failed to keep the splash screen visible:', error)
  captureException(error)
})

// index.js imports this module last, so reaching here means every shim, polyfill,
// Sentry init and localization bundle in the entry graph has been evaluated.
markBoot(BOOT_MARK.rnEntryModuleEvaluated)

// Reads the Stallion context in a sibling of AppInit, so a Stallion state change re-renders only
// this component and not the whole app.
const OtaVersionTag = () => {
  const { currentlyRunningBundle } = useStallionUpdate()

  useEffect(() => {
    // Stallion gets the running version only from its server, so a startup crash or an offline
    // session can't tell an OTA from the store bundle. Claiming the store bundle would be wrong.
    setTagContext(OTA_VERSION_TAG, String(currentlyRunningBundle?.version ?? OTA_VERSION_UNKNOWN))
  }, [currentlyRunningBundle?.version])

  return null
}

const App = () => {
  markBootOnce(BOOT_MARK.rnAppRender)

  return (
    <>
      <OtaVersionTag />
      <AppInit />
    </>
  )
}

export default withStallion(App)

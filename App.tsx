import '@common/config/localization'

import * as SplashScreen from 'expo-splash-screen'
import React from 'react'
import { withStallion } from 'react-native-stallion'

import AppInit from '@common/modules/app-init/screens/AppInit'
import { BOOT_MARK, markBoot, markBootOnce } from '@mobile/services/bootProfiler'

SplashScreen.preventAutoHideAsync().catch(console.warn) // TODO: log a sentry error

// index.js imports this module last, so reaching here means every shim, polyfill,
// Sentry init and localization bundle in the entry graph has been evaluated.
markBoot(BOOT_MARK.rnEntryModuleEvaluated)

const App = () => {
  markBootOnce(BOOT_MARK.rnAppRender)

  return <AppInit />
}

export default withStallion(App)

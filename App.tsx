import '@common/config/localization'

import * as SplashScreen from 'expo-splash-screen'
import React from 'react'

import AppInit from '@common/modules/app-init/screens/AppInit'

SplashScreen.preventAutoHideAsync().catch(console.warn) // TODO: log a sentry error

const App = () => <AppInit />

export default App

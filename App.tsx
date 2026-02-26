import '@common/config/localization'

import * as SplashScreen from 'expo-splash-screen'
import React from 'react'

import AppInit from '@common/modules/app-init/screens/AppInit'

// eslint-disable-next-line no-console
SplashScreen.preventAutoHideAsync().catch(console.warn) // TODO: log a sentry error

const App = () => {
  React.useEffect(() => {
    SplashScreen.hideAsync().catch(() => {})
  }, [])

  return <AppInit />
}

export default App

import '@common/config/localization'

import * as SplashScreen from 'expo-splash-screen'
import React, { useEffect } from 'react'
import { Alert } from 'react-native'

import AppInit from '@common/modules/app-init/screens/AppInit'
import { RELAYER_URL } from '@env'

SplashScreen.preventAutoHideAsync().catch(console.warn) // TODO: log a sentry error

const App = () => {
  useEffect(() => {
    // Temporary debug to verify CI env vars at runtime.
    Alert.alert('RELAYER_URL from @env', RELAYER_URL || 'RELAYER_URL is empty')
    Alert.alert(
      'RELAYER_URL from process.env',
      process.env.RELAYER_URL || 'RELAYER_URL from env is empty'
    )
  }, [])

  return <AppInit />
}

export default App

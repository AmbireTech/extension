// import '@common/config/localization'

// import * as SplashScreen from 'expo-splash-screen'
import React, { useEffect } from 'react'
import { Alert, Text } from 'react-native'

// import { Alert } from 'react-native'
import { RELAYER_URL } from '@env'

// SplashScreen.preventAutoHideAsync().catch(console.warn) // TODO: log a sentry error

const App = () => {
  useEffect(() => {
    // Temporary debug to verify CI env vars at runtime.
    Alert.alert('RELAYER_URL from @env', RELAYER_URL || 'RELAYER_URL is empty')
    Alert.alert(
      'RELAYER_URL from process.env',
      process.env.RELAYER_URL || 'RELAYER_URL from env is empty'
    )
  }, [])

  return null
}

export default App

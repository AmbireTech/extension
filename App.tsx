// So that the localization gets initialized at the beginning.
import '@common/config/localization'

import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import AppInit from '@common/modules/app-init/screens/AppInit'
import colors from '@common/styles/colors'
import flexboxStyles from '@common/styles/utils/flexbox'

SplashScreen.preventAutoHideAsync().catch(console.warn) // TODO: log a sentry error

const App = () => {
  return (
    <GestureHandlerRootView style={[flexboxStyles.flex1, { backgroundColor: colors.zircon }]}>
      <StatusBar style="light" backgroundColor={colors.zircon} />

      <AppInit />
    </GestureHandlerRootView>
  )
}

export default App
